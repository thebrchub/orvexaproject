import { useState, useEffect } from 'react';
import {
  People,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
  PersonAdd,
  AssignmentTurnedIn,
  AccountBalanceWallet,
  Refresh,
  ChevronRight,
  Assessment,
  Description,
  Warning,
  Work
} from '@mui/icons-material';
import { api, parseApiError } from '../lib/api';
import type { EmployeeResponse, AttendanceRecord, PayrollRecord } from '../lib/api';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRelativeTime = (dateString: string | number | undefined): string => {
  if (!dateString) return 'Recently';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

interface Activity {
  action: string;
  person: string;
  time: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function Dashboard() {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date().toISOString().split('T')[0];
      
      const [employeesData, attendanceData, payrollData] = await Promise.all([
        api.getAllEmployees(),
        api.getAttendance(today),
        api.getPayrollRecords()
      ]);
      
      console.log('Dashboard Data Loaded:');
      console.log('Employees:', employeesData);
      console.log('Attendance:', attendanceData);
      console.log('Payroll:', payrollData);
      
      setEmployees(employeesData);
      setAttendanceRecords(attendanceData);
      setPayrollRecords(payrollData);
    } catch (err: any) {
      const errorMsg = parseApiError(err);
      setError(errorMsg);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalEmployees: employees.length,
    presentToday: attendanceRecords.filter(record => 
      record.status === 'checked-in' || record.status === 'checked-out'
    ).length,
    absentToday: attendanceRecords.filter(record => record.status === 'not-marked').length,
    lateToday: attendanceRecords.filter(record => 
      record.status === 'check-in-requested'
    ).length,
    totalSalaryThisMonth: employees.reduce((sum, emp) => {
      const salary = emp.details?.salary || 0;
      return sum + salary;
    }, 0),
    pendingPayrolls: payrollRecords.filter(record => 
      record.status === 'draft' || record.status === 'processed'
    ).length,
  };

  const attendanceRate = stats.totalEmployees > 0 
    ? Math.round((stats.presentToday / stats.totalEmployees) * 100) 
    : 0;

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees.toString(),
      icon: <People sx={{ fontSize: 32 }} />,
      textColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Present Today',
      value: stats.presentToday.toString(),
      icon: <CheckCircle sx={{ fontSize: 32 }} />,
      textColor: 'text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      title: 'Absent Today',
      value: stats.absentToday.toString(),
      icon: <Cancel sx={{ fontSize: 32 }} />,
      textColor: 'text-red-600',
      iconBg: 'bg-red-100',
    },
    {
      title: 'Late Arrivals',
      value: stats.lateToday.toString(),
      icon: <Schedule sx={{ fontSize: 32 }} />,
      textColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
    },
  ];

  const generateActivities = (): Activity[] => {
    const activities: Activity[] = [];
    
    const recentEmployees = [...employees]
      .sort((a, b) => {
        const dateA = new Date(a.doj || 0).getTime();
        const dateB = new Date(b.doj || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 2);
    
    recentEmployees.forEach(emp => {
      activities.push({
        action: 'New employee added',
        person: emp.name || 'Unknown',
        time: getRelativeTime(emp.doj),
        icon: <PersonAdd />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      });
    });
    
    const recentAttendance = [...attendanceRecords]
      .filter(record => record.checkIn)
      .slice(0, 2);
    
    recentAttendance.forEach(record => {
      activities.push({
        action: 'Attendance marked',
        person: record.employeeName || 'Unknown',
        time: getRelativeTime(record.checkIn || undefined),
        icon: <CheckCircle />,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    });
    
    const recentPayroll = [...payrollRecords]
      .sort((a, b) => {
        const dateA = new Date(a.generatedAt || 0).getTime();
        const dateB = new Date(b.generatedAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 1);
    
    recentPayroll.forEach(record => {
      activities.push({
        action: 'Payroll generated',
        person: record.employeeName || 'Unknown',
        time: getRelativeTime(record.generatedAt),
        icon: <AccountBalanceWallet />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      });
    });
    
    return activities.slice(0, 4);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <Warning sx={{ fontSize: 64, color: '#f87171', mb: 2 }} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold inline-flex items-center gap-2"
        >
          <Refresh />
          Try Again
        </button>
      </div>
    );
  }

  const activities = generateActivities();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-black">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-black font-bold mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">
              Welcome back! Here's what's happening with your team today.
            </p>
          </div>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 text-sm"
          >
            <Refresh sx={{ fontSize: 18 }} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceOverview 
            attendanceRate={attendanceRate}
            present={stats.presentToday}
            absent={stats.absentToday}
            late={stats.lateToday}
          />
        </div>

        <div className="space-y-6">
          <QuickActions />
          <PayrollSummary 
            totalSalary={stats.totalSalaryThisMonth}
            pendingPayrolls={stats.pendingPayrolls}
          />
        </div>
      </div>

      <RecentActivity activities={activities} />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  textColor: string;
}

function StatCard({ title, value, icon, iconBg, textColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
        </div>
        <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface AttendanceOverviewProps {
  attendanceRate: number;
  present: number;
  absent: number;
  late: number;
}

function AttendanceOverview({ attendanceRate, present, absent, late }: AttendanceOverviewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
            <Assessment />
          </div>
          Today's Attendance
        </h2>
        <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
          attendanceRate >= 90 ? 'bg-green-100 text-green-700' :
          attendanceRate >= 70 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {attendanceRate}% Present
        </span>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm font-semibold text-gray-700 mb-3">
          <span>Attendance Rate</span>
          <span>{attendanceRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${
              attendanceRate >= 90 ? 'bg-gradient-to-r from-green-500 to-green-600' :
              attendanceRate >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
              'bg-gradient-to-r from-red-500 to-red-600'
            }`}
            style={{ width: `${attendanceRate}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <div className="text-3xl font-bold text-green-700 mb-1">{present}</div>
          <div className="text-sm font-semibold text-green-800">Present</div>
        </div>
        <div className="text-center p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
          <div className="text-3xl font-bold text-red-700 mb-1">{absent}</div>
          <div className="text-sm font-semibold text-red-800">Absent</div>
        </div>
        <div className="text-center p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
          <div className="text-3xl font-bold text-yellow-700 mb-1">{late}</div>
          <div className="text-sm font-semibold text-yellow-800">Late</div>
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { 
      label: 'Add Employee', 
      icon: <PersonAdd />, 
      href: '/employees', 
      color: 'from-blue-500 to-blue-600', 
      hoverColor: 'hover:from-blue-600 hover:to-blue-700' 
    },
    { 
      label: 'Mark Attendance', 
      icon: <AssignmentTurnedIn />, 
      href: '/attendance', 
      color: 'from-green-500 to-green-600', 
      hoverColor: 'hover:from-green-600 hover:to-green-700' 
    },
    { 
      label: 'Generate Payroll', 
      icon: <AccountBalanceWallet />, 
      href: '/payroll', 
      color: 'from-purple-500 to-purple-600', 
      hoverColor: 'hover:from-purple-600 hover:to-purple-700' 
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
          <TrendingUp sx={{ fontSize: 18 }} />
        </div>
        Quick Actions
      </h2>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className={`flex items-center justify-center gap-2 w-full py-4 px-4 rounded-xl text-white font-bold transition-all duration-200 bg-gradient-to-r ${action.color} ${action.hoverColor} shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
          >
            {action.icon}
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
}

interface PayrollSummaryProps {
  totalSalary: number;
  pendingPayrolls: number;
}

function PayrollSummary({ totalSalary, pendingPayrolls }: PayrollSummaryProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white">
          <Work sx={{ fontSize: 18 }} />
        </div>
        Payroll Summary
      </h2>
      <div className="space-y-5">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-2">Total Monthly Salary</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalSalary)}</p>
        </div>
        <div className="flex items-center justify-between p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
          <div>
            <p className="text-sm font-semibold text-orange-800 mb-1">Pending Payrolls</p>
            <p className="text-2xl font-bold text-orange-700">{pendingPayrolls}</p>
          </div>
          <Schedule sx={{ fontSize: 40, color: '#ea580c' }} />
        </div>
      </div>
    </div>
  );
}

interface RecentActivityProps {
  activities: Activity[];
}

function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center text-white">
            <Description />
          </div>
          Recent Activity
        </h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-bold hover:underline transition-all flex items-center gap-1">
          View All
          <ChevronRight sx={{ fontSize: 18 }} />
        </button>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200">
              <div className={`w-12 h-12 ${activity.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500 mt-0.5">{activity.person} • {activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded-lg w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="animate-pulse flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded-lg w-1/2 mb-4"></div>
              <div className="space-y-3">
                <div className="h-12 bg-gray-200 rounded-xl"></div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}