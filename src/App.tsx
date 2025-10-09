import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Employees from "./pages/employees";
import Attendance from "./pages/attendance";
import Payroll from "./pages/payroll";
import Login from "./pages/login";
import CompanySettings from "./pages/companysettings";
import SupportStaff from "./pages/support/SupportCompanyDemoPage"; // ✅ Our new support page

// ✅ Sidebar Component
function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/employees", label: "Employees", icon: "👥" },
    { path: "/attendance", label: "Attendance", icon: "📋" },
    { path: "/payroll", label: "Payroll", icon: "💰" },
    { path: "/company-settings", label: "Company Settings", icon: "🏢" }, // ✅ New option
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl fixed top-0 left-0 h-screen overflow-y-auto">
      <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
        <h2 className="text-2xl font-bold text-blue-400">Orvexa Admin</h2>
        <p className="text-gray-400 text-sm mt-1">Attendance Management</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive(item.path)
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>

        <div className="text-xs text-gray-400 text-center mt-3">
          <p>© 2025 Orvexa Platform</p>
          <p className="mt-1">v1.0.0 MVP</p>
        </div>
      </div>
    </aside>
  );
}

// ✅ Header Component
function Header() {
  return (
    <header className="flex justify-between items-center p-4 border-b bg-white shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Welcome Back!</h1>
        <p className="text-gray-500 text-sm">
          Manage your team's attendance and payroll
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
          ✅ System Online
        </div>
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          A
        </div>
      </div>
    </header>
  );
}

// ✅ Protected Route Wrapper
function PrivateRoute({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/login" replace />;
}

// ✅ Layout Wrapper (for admin panel)
function Layout() {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/company-settings" element={<CompanySettings />} /> {/* ✅ New route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ✅ Main App Component
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Support Staff Demo Page */}
        <Route path="/support-staff" element={<SupportStaff />} />

        {/* Public Login route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin routes */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
