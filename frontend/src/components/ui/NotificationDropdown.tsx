import { useState, useEffect, useRef } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import API from "../../services/api";

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 relative focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-green-600 font-semibold hover:text-green-700"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 flex justify-center text-slate-400">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                You have no notifications.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition ${
                      notif.is_read ? "bg-white opacity-60" : "bg-blue-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-sm text-slate-700 mt-0.5">{notif.message}</p>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-slate-400 hover:text-green-600 shrink-0"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase mt-2 block">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
