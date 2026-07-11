import { Link, NavLink, useNavigate, Outlet, Navigate } from "react-router-dom";
import { LayoutDashboard, Shield, CalendarRange, User, LogOut, Bell, Menu, Tractor, DollarSign, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "../components/ui/NotificationDropdown";

const ProviderLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && user?.role !== "provider") {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { name: "Dashboard", path: "/provider", icon: <LayoutDashboard size={20} /> },
    { name: "My Services", path: "/provider/services", icon: <Tractor size={20} /> },
    { name: "Manage Bookings", path: "/provider/bookings", icon: <CalendarRange size={20} /> },
    { name: "My Earnings", path: "/provider/earnings", icon: <DollarSign size={20} /> },
    { name: "Price Surveys", path: "/provider/surveys", icon: <BarChart3 size={20} /> },
    { name: "Business Profile", path: "/provider/profile", icon: <User size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const userInitials = user ? getInitials(user.name) : "P";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-100 flex flex-col justify-between fixed h-full z-40 transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 group">
            <img 
              src="/provider-logo.png" 
              alt="Provider Logo" 
              className={`object-contain transition-all duration-300 ${isSidebarOpen ? 'w-32 h-auto' : 'w-10 h-10'}`} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) {
                  fallback.classList.remove('hidden');
                  fallback.classList.add('flex');
                }
              }}
            />
            <div className="hidden items-center gap-3">
              <Tractor className="text-green-700 shrink-0" size={28} />
              {isSidebarOpen && (
                <span className="text-xl font-bold text-slate-800 tracking-tight">KisanSeeva</span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/provider"}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-250 ${
                    isActive
                      ? "bg-yellow-500 text-slate-900 font-semibold shadow-md"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`
                }
              >
                {item.icon}
                {isSidebarOpen && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl w-full text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "pl-64" : "pl-20"}`}>
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-800">Provider Portal</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Availability Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                {isOnline ? "Accepting Jobs" : "Offline"}
              </span>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                  isOnline ? "bg-green-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    isOnline ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Notification Bell */}
            <NotificationDropdown />

            {/* Profile Brief */}
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
              {user?.documents?.selfie ? (
                <img 
                  src={user.documents.selfie} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover border border-yellow-250"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-slate-850">
                  {userInitials}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-800">{user?.name || "Provider"}</p>
                <p className="text-xs text-slate-400">Owner (Verified)</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="p-6 md:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProviderLayout;
