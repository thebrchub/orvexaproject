import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Employees from "./pages/employees";
import Attendance from "./pages/attendance";
import Payroll from "./pages/payroll";
import Login from "./pages/login";

function Sidebar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/employees", label: "Employees", icon: "👥" },
    { path: "/attendance", label: "Attendance", icon: "📋" },
    { path: "/payroll", label: "Payroll", icon: "💰" },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-blue-400">Orvexa Admin</h2>
        <p className="text-gray-400 text-sm mt-1">Attendance Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
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

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          <p>© 2025 Orvexa Platform</p>
          <p className="mt-1">v1.0.0 MVP</p>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header>
      <div className="header-left">
        <h1>Welcome Back!</h1>
        <p>Manage your team's attendance and payroll</p>
      </div>
      <div className="header-right">
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

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/payroll" element={<Payroll />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}