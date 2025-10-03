import React, { useState, useEffect } from 'react';
import { api,  formatCurrency } from '../lib/api';
import type { DashboardStats, } from '../lib/api';


export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-500 mb-4">{error || 'Something went wrong'}</p>
        <button onClick={loadDashboardData} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const attendanceRate = stats.totalEmployees > 0 
    ? Math.round((stats.presentToday / stats.totalEmployees) * 100) 
    : 0;

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees.toString(),
      icon: '👥',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Present Today',
      value: stats.presentToday.toString(),
      icon: '✅',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Absent Today',
      value: stats.absentToday.toString(),
      icon: '❌',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      title: 'Late Arrivals',
      value: stats.lateToday.toString(),
      icon: '⏰',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-blue-100">
              Welcome back! Here's what's happening with your team today.
            </p>
          </div>
          <div className="text-6xl opacity-20">📊</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Overview */}
        <div className="lg:col-span-2">
          <AttendanceOverview 
            attendanceRate={attendanceRate}
            present={stats.presentToday}
            absent={stats.absentToday}
            late={stats.lateToday}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
          <PayrollSummary 
            totalSalary={stats.totalSalaryThisMonth}
            pendingPayrolls={stats.pendingPayrolls}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color, bgColor, textColor }: {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${bgColor} mr-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// Attendance Overview Component
function AttendanceOverview({ attendanceRate, present, absent, late }: {
  attendanceRate: number;
  present: number;
  absent: number;
  late: number;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Today's Attendance</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
          attendanceRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {attendanceRate}% Present
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Attendance Rate</span>
          <span>{attendanceRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              attendanceRate >= 90 ? 'bg-green-500' :
              attendanceRate >= 70 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${attendanceRate}%` }}
          ></div>
        </div>
      </div>

      {/* Attendance Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{present}</div>
          <div className="text-sm text-green-800">Present</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{absent}</div>
          <div className="text-sm text-red-800">Absent</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{late}</div>
          <div className="text-sm text-yellow-800">Late</div>
        </div>
      </div>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    { label: 'Add Employee', icon: '➕', href: '/employees', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Mark Attendance', icon: '📋', href: '/attendance', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Generate Payroll', icon: '💰', href: '/payroll', color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className={`block w-full text-center py-3 px-4 rounded-lg text-white font-medium transition-colors duration-200 ${action.color}`}
          >
            <span className="mr-2">{action.icon}</span>
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// Payroll Summary Component
function PayrollSummary({ totalSalary, pendingPayrolls }: {
  totalSalary: number;
  pendingPayrolls: number;
}) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Payroll Summary</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Total Monthly Salary</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSalary)}</p>
        </div>
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-orange-800">Pending Payrolls</p>
            <p className="text-lg font-bold text-orange-600">{pendingPayrolls}</p>
          </div>
          <span className="text-2xl">⏳</span>
        </div>
      </div>
    </div>
  );
}

// Recent Activity Component
function RecentActivity() {
  const activities = [
    { action: 'New employee added', person: 'John Doe', time: '2 hours ago', icon: '👤', color: 'text-blue-600' },
    { action: 'Payroll generated', person: 'HR Department', time: '4 hours ago', icon: '💰', color: 'text-green-600' },
    { action: 'Attendance marked', person: 'Jane Smith', time: '6 hours ago', icon: '✅', color: 'text-purple-600' },
    { action: 'Employee updated', person: 'Mike Johnson', time: '1 day ago', icon: '✏️', color: 'text-orange-600' },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
            <span className={`text-xl ${activity.color}`}>{activity.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{activity.action}</p>
              <p className="text-xs text-gray-500">{activity.person} • {activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="animate-pulse flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="card">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}