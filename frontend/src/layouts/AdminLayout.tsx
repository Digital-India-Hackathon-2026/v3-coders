import { Link, NavLink, useNavigate, Outlet, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, UserCog, CalendarRange, PieChart, LogOut, Bell, Menu, Tractor, Settings, BarChart3, ShieldAlert, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-red-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { name: "Overview", path: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Manage Farmers", path: "/admin/users", icon: <Users size={20} /> },
    { name: "Manage Providers", path: "/admin/providers", icon: <Tractor size={20} /> },
    { name: "All Bookings", path: "/admin/bookings", icon: <CalendarRange size={20} /> },
    { name: "Analytics & Reports", path: "/admin/reports", icon: <BarChart3 size={20} /> },
    { name: "Pricing Surveys", path: "/admin/surveys", icon: <PieChart size={20} /> },
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

  const userInitials = user ? getInitials(user.name) : "AD";

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between fixed h-full z-40 transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <ShieldAlert className="text-red-500 shrink-0" size={28} />
            {isSidebarOpen && (
              <span className="text-xl font-bold text-white tracking-tight">KS Admin</span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-250 ${
                    isActive
                      ? "bg-red-600 text-white font-semibold shadow-lg shadow-red-600/10"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
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
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl w-full text-red-500 hover:bg-red-950/30 transition border-0 cursor-pointer"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-semibold">Exit Portal</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "pl-64" : "pl-20"}`}>
        {/* Top Navbar */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-bold text-white">System Admin Console</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Brief */}
            <div className="flex items-center gap-3">
              {user?.documents?.selfie ? (
                <img 
                  src={user.documents.selfie} 
                  alt="Admin Profile" 
                  className="w-10 h-10 rounded-full object-cover border border-red-500/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-500/30 flex items-center justify-center font-bold text-red-500">
                  {userInitials}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-white">{user?.name || "System Admin"}</p>
                <p className="text-xs text-slate-500">All permissions active</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="p-6 md:p-8 flex-1 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
