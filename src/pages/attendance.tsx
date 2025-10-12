import { useState, useEffect } from 'react';
import { api, parseApiError } from '../lib/api';
import type { AttendanceResponse } from '../lib/api';
import Table, { StatusBadge } from '../components/Table';
import Modal, {  ConfirmModal, SuccessModal, } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import { formatTime, } from '../utils/timeUtils';

// Types matching backend structure
interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number;
  status: 'not-marked' | 'check-in-requested' | 'check-in-rejected' | 'checked-in' | 'check-out-requested' | 'checked-out' | 'check-out-rejected';
  notes?: string;
  rawStatus?: string;
}

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  fullName: string;
  email: string;
  mobile: string;
  position?: string;
  department?: string;
  status?: string;
}

interface ApprovalRequest {
  employeeId: string;
  employeeName: string;
  type: 'check-in' | 'check-out';
  time: string;
  isLate?: boolean;
}

export default function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Approval requests state
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  // Modal states
  const [_isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [_isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isManualCheckInModalOpen, setIsManualCheckInModalOpen] = useState(false);
  const [isManualCheckOutModalOpen, setIsManualCheckOutModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [_successMessage, setSuccessMessage] = useState('');
  const [_errorMessage, setErrorMessage] = useState('');
  const [approvingLoading, setApprovingLoading] = useState(false);

  // Company settings for late check-in calculation
  const [companySettings, setCompanySettings] = useState<any>(null);

  // Load company settings
  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const settings = await api.getCompanyDetails();
      setCompanySettings(settings);
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  };

  // Check if employee is late based on check-in time
  const isLate = (checkInTime: string | null): boolean => {
    if (!checkInTime || !companySettings?.lastAllowedCheckInTime) return false;
    
    const checkIn = checkInTime.split(':').map(Number);
    const allowed = companySettings.lastAllowedCheckInTime.split(':').map(Number);
    
    const checkInMinutes = checkIn[0] * 60 + checkIn[1];
    const allowedMinutes = allowed[0] * 60 + allowed[1];
    
    return checkInMinutes > allowedMinutes;
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData(true); // Silent refresh
    }, 10000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, selectedDate]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const [employeesData, attendanceData] = await Promise.all([
        api.getEmployees(),
        api.getAttendance(selectedDate)
      ]);
      
      setEmployees(employeesData);
      setAttendanceRecords(attendanceData);
      setLastRefresh(new Date());
      
      const requests: ApprovalRequest[] = [];
      attendanceData.forEach(record => {
        const employee = employeesData.find(e => e.email === record.employeeId);
        const employeeName = employee?.name || record.employeeName;
        
        if (record.status === 'check-in-requested') {
          requests.push({
            employeeId: record.employeeId,
            employeeName: employeeName,
            type: 'check-in',
            time: record.checkIn || 'Unknown time',
            isLate: isLate(record.checkIn)
          });
        } else if (record.status === 'check-out-requested') {
          requests.push({
            employeeId: record.employeeId,
            employeeName: employeeName,
            type: 'check-out',
            time: record.checkOut || 'Unknown time'
          });
        }
      });
      
      if (requests.length > 0 && requests.length > approvalRequests.length) {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
          audio.play().catch(() => {});
        } catch (err) {}
      }
      
      setApprovalRequests(requests);
      
      if (requests.length > 0) {
        setShowApprovalModal(true);
      }
      
    } catch (error: any) {
      console.error('Failed to load attendance data:', error);
      if (!silent) {
        setErrorMessage(parseApiError(error));
        setIsErrorModalOpen(true);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const stats = {
    totalEmployees: employees.length,
    present: attendanceRecords.filter(record => 
      record.status === 'checked-in' || record.status === 'checked-out'
    ).length,
    absent: attendanceRecords.filter(record => 
      record.status === 'check-in-rejected' || record.status === 'check-out-rejected'
    ).length,
    late: attendanceRecords.filter(record => 
      (record.status === 'checked-in' || record.status === 'checked-out') && isLate(record.checkIn)
    ).length,
    onTime: attendanceRecords.filter(record => 
      (record.status === 'checked-in' || record.status === 'checked-out') && !isLate(record.checkIn)
    ).length,
    pendingApprovals: approvalRequests.length,
  };

  const attendanceRate = stats.totalEmployees > 0 
    ? Math.round((stats.present / stats.totalEmployees) * 100) 
    : 0;

  // ✅ FIXED: Handle approving with proper time handling
  // ✅ FIXED: Replace your handleApprove function with this version

// REPLACE your handleApprove function with this corrected version:

// ✅ FINAL FIXED VERSION - Replace the handleApprove function only

const handleApprove = async (employeeEmail: string, employeeName: string, type: 'check-in' | 'check-out') => {
  try {
    setApprovingLoading(true);
    
    console.log('🔍 Fetching latest attendance for:', employeeEmail, 'Date:', selectedDate);
    
    // Fetch the latest attendance record from backend
    const allAttendance = await api.getAttendance(selectedDate);
    const record = allAttendance.find(r => r.employeeId === employeeEmail);
    
    if (!record) {
      throw new Error('Attendance record not found');
    }
    
    console.log('📋 Current record:', {
      employeeEmail,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut
    });
    
    // ⚠️ Generate current time if needed
    const now = new Date();
    const hours = now.getUTCHours().toString().padStart(2, '0');
    const minutes = now.getUTCMinutes().toString().padStart(2, '0');
    const seconds = now.getUTCSeconds().toString().padStart(2, '0');
    const currentTimeUTC = `${hours}:${minutes}:${seconds}`;
    
    let checkInTime: string;
    let checkOutTime: string | null;
    
    if (type === 'check-in') {
      // For check-in approval: Use existing check-in time or current time
      checkInTime = record.checkIn || currentTimeUTC;
      checkOutTime = null; // Clear check-out when approving check-in
      
      console.log('✅ Approving check-in:', {
        checkInTime,
        checkOutTime,
        status: 'CHECKED_IN'
      });
    } else {
      // For check-out approval
      checkInTime = record.checkIn || currentTimeUTC;
      
      // ✅ Use the EXISTING check-out time if available, otherwise use current time
      checkOutTime = record.checkOut || currentTimeUTC;
      
      console.log('✅ Approving check-out:', {
        checkInTime,
        checkOutTime,
        status: 'CHECKED_OUT',
        note: record.checkOut ? 'Using existing check-out time' : 'Using current time as check-out'
      });
    }
    
    // ✅ Use the UPDATE endpoint (PUT) to save both times and status
    const updatedAttendance: AttendanceResponse = {
      details: {
        employeeEmail: employeeEmail,
        attendanceDate: selectedDate,
      },
      checkIn: checkInTime,
      checkOut: checkOutTime,
      attendanceStatus: type === 'check-in' ? 'CHECKED_IN' : 'CHECKED_OUT',
      otHours: record.workingHours || 0,
    };
    
    console.log('📤 Sending update via PUT endpoint:', updatedAttendance);
    
    // Use UPDATE endpoint instead of APPROVE endpoint
    await api.updateAttendance(employeeEmail, updatedAttendance, selectedDate);
    
    // Refresh data
    await loadData(true);
    
    const approvedTime = type === 'check-in' ? checkInTime : checkOutTime;
    setSuccessMessage(`${type === 'check-in' ? 'Check-in' : 'Check-out'} approved for ${employeeName} at ${formatTime(approvedTime || '')}!`);
    setIsSuccessModalOpen(true);
    
    setApprovalRequests(prev => prev.filter(req => req.employeeId !== employeeEmail));
    
    if (approvalRequests.length <= 1) {
      setShowApprovalModal(false);
    }
    
  } catch (error: any) {
    console.error('❌ Failed to approve:', error);
    setErrorMessage(parseApiError(error));
    setIsErrorModalOpen(true);
  } finally {
    setApprovingLoading(false);
  }
};

  const handleReject = async (employeeEmail: string, employeeName: string, type: 'check-in' | 'check-out') => {
    try {
      setApprovingLoading(true);
      
      const record = attendanceRecords.find(r => r.employeeId === employeeEmail);
      
      if (!record) {
        throw new Error('Attendance record not found');
      }
      
      const updatedAttendance: AttendanceResponse = {
        details: {
          employeeEmail: employeeEmail,
          attendanceDate: selectedDate,
        },
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        attendanceStatus: type === 'check-in' ? 'CHECK_IN_REJECTED' : 'CHECK_OUT_REJECTED',
        otHours: record.workingHours || 0,
      };
      
      await api.updateAttendance(employeeEmail, updatedAttendance, selectedDate);
      await loadData(true);
      
      setSuccessMessage(`${type === 'check-in' ? 'Check-in' : 'Check-out'} rejected for ${employeeName}.`);
      setIsSuccessModalOpen(true);
      
      setApprovalRequests(prev => prev.filter(req => req.employeeId !== employeeEmail));
      
      if (approvalRequests.length <= 1) {
        setShowApprovalModal(false);
      }
      
    } catch (error: any) {
      console.error('Failed to reject:', error);
      setErrorMessage(parseApiError(error));
      setIsErrorModalOpen(true);
    } finally {
      setApprovingLoading(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!selectedEmployee) return;
    
    try {
      setApprovingLoading(true);
      
      const record = attendanceRecords.find(r => r.employeeId === selectedEmployee.id);
      
      let checkInTime: string;
      
      if (record?.checkIn) {
        checkInTime = record.checkIn;
      } else {
        const now = new Date();
        checkInTime = now.toISOString().split('T')[1].split('.')[0];
      }
      
      const updatedAttendance: AttendanceResponse = {
        details: {
          employeeEmail: selectedEmployee.id,
          attendanceDate: selectedDate,
        },
        checkIn: checkInTime,
        checkOut: record?.checkOut || null,
        attendanceStatus: 'CHECKED_IN',
        otHours: record?.workingHours || 0,
      };
      
      await api.updateAttendance(selectedEmployee.id, updatedAttendance, selectedDate);
      await loadData(true);
      
      setIsManualCheckInModalOpen(false);
      setSelectedEmployee(null);
      
      setSuccessMessage(`Manually checked in ${selectedEmployee.name} at ${formatTime(checkInTime)}`);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Failed to manual check-in:', error);
      setErrorMessage(parseApiError(error));
      setIsErrorModalOpen(true);
    } finally {
      setApprovingLoading(false);
    }
  };

  const handleManualCheckOut = async () => {
    if (!selectedEmployee) return;
    
    try {
      setApprovingLoading(true);
      
      const record = attendanceRecords.find(r => r.employeeId === selectedEmployee.id);
      
      let checkOutTime: string;
      
      if (record?.checkOut) {
        checkOutTime = record.checkOut;
      } else {
        const now = new Date();
        checkOutTime = now.toISOString().split('T')[1].split('.')[0];
      }
      
      const updatedAttendance: AttendanceResponse = {
        details: {
          employeeEmail: selectedEmployee.id,
          attendanceDate: selectedDate,
        },
        checkIn: record?.checkIn || null,
        checkOut: checkOutTime,
        attendanceStatus: 'CHECKED_OUT',
        otHours: record?.workingHours || 0,
      };
      
      await api.updateAttendance(selectedEmployee.id, updatedAttendance, selectedDate);
      await loadData(true);
      
      setIsManualCheckOutModalOpen(false);
      setSelectedEmployee(null);
      
      setSuccessMessage(`Manually checked out ${selectedEmployee.name} at ${formatTime(checkOutTime)}`);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Failed to manual check-out:', error);
      setErrorMessage(parseApiError(error));
      setIsErrorModalOpen(true);
    } finally {
      setApprovingLoading(false);
    }
  };

  const unmarkedEmployees = employees.filter(emp => 
    !attendanceRecords.some(record => record.employeeId === emp.email)
  );

  const columns = [
    {
      key: 'employeeName',
      label: 'Employee',
      width: '20%',
      render: (value: string, row: AttendanceRecord) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
            {value?.charAt(0).toUpperCase() || 'E'}
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.employeeId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'checkIn',
      label: 'Check In',
      width: '15%',
      render: (value: string | null, row: AttendanceRecord) => {
        console.log('CheckIn Debug:', { 
          employeeName: row.employeeName, 
          checkInValue: value, 
          status: row.status,
          rawStatus: row.rawStatus 
        });
        
        return (
          <div>
            <span className={`${value ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {value ? formatTime(value) : 'Not checked in'}
            </span>
            {row.status === 'check-in-requested' && (
              <span className="block text-xs text-orange-600 font-medium mt-1">
                ⏳ Pending approval
              </span>
            )}
            {value && isLate(value) && (row.status === 'checked-in' || row.status === 'checked-out') && (
              <span className="block text-xs text-orange-600 font-medium mt-1">
                ⚠️ Late arrival
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      width: '15%',
      render: (value: string | null, row: AttendanceRecord) => {
        console.log('CheckOut Debug:', { 
          employeeName: row.employeeName, 
          checkOutValue: value, 
          status: row.status,
          rawStatus: row.rawStatus 
        });
        
        return (
          <div>
            <span className={`${value ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {value ? formatTime(value) : 'Not checked out'}
            </span>
            {row.status === 'check-out-requested' && (
              <span className="block text-xs text-orange-600 font-medium mt-1">
                ⏳ Pending approval
              </span>
            )}
            {value && row.status === 'checked-out' && (
              <span className="block text-xs text-green-600 font-medium mt-1">
                ✓ Completed
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'workingHours',
      label: 'Working Hours',
      width: '12%',
      render: (value: number) => (
        <span className="font-medium">{value.toFixed(1)}h</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '13%',
      render: (value: string) => <StatusBadge status={value} type="attendance" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '20%',
      render: (_value: any, row: AttendanceRecord) => (
        <div className="flex items-center space-x-2">
          {row.status === 'check-in-requested' && (
            <>
              <button
                onClick={() => handleApprove(row.employeeId, row.employeeName, 'check-in')}
                disabled={approvingLoading}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleReject(row.employeeId, row.employeeName, 'check-in')}
                disabled={approvingLoading}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                ✗ Reject
              </button>
            </>
          )}

          {row.status === 'check-out-requested' && (
            <>
              <button
                onClick={() => handleApprove(row.employeeId, row.employeeName, 'check-out')}
                disabled={approvingLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleReject(row.employeeId, row.employeeName, 'check-out')}
                disabled={approvingLoading}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                ✗ Reject
              </button>
            </>
          )}

          {(row.status === 'check-in-rejected' || row.status === 'not-marked') && (
            <button
              onClick={() => {
                setSelectedEmployee({ id: row.employeeId, name: row.employeeName });
                setIsManualCheckInModalOpen(true);
              }}
              disabled={approvingLoading}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              📝 Manual Check-In
            </button>
          )}

          {row.status === 'check-out-rejected' && (
            <button
              onClick={() => {
                setSelectedEmployee({ id: row.employeeId, name: row.employeeName });
                setIsManualCheckOutModalOpen(true);
              }}
              disabled={approvingLoading}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              📝 Manual Check-Out
            </button>
          )}

          {row.status === 'checked-in' && (
            <span className="text-sm text-green-600 font-medium">✓ Checked In</span>
          )}

          {row.status === 'checked-out' && (
            <span className="text-sm text-gray-500">✓ Completed</span>
          )}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Track and manage employee attendance</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-700 cursor-pointer">
              Auto-refresh (10s)
            </label>
          </div>
          
          <button 
            onClick={() => loadData()}
            disabled={loading}
            className="btn-secondary flex items-center disabled:opacity-50"
          >
            <span className="mr-2">🔄</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          {approvalRequests.length > 0 && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="btn-primary flex items-center animate-pulse"
            >
              <span className="mr-2">🔔</span>
              {approvalRequests.length} Pending Approval{approvalRequests.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Last updated: {lastRefresh.toLocaleTimeString('en-IN')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="card">
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            label="Select Date"
            maxDate={new Date().toISOString().split('T')[0]}
            className="w-full"
          />
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 mr-4">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50 mr-4">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-50 mr-4">
              <span className="text-2xl">❌</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-50 mr-4">
              <span className="text-2xl">⏳</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Attendance Rate for {new Date(selectedDate).toLocaleDateString('en-IN', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
            attendanceRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {attendanceRate}% Present
          </span>
        </div>

        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-300 ${
                attendanceRate >= 90 ? 'bg-green-500' :
                attendanceRate >= 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${attendanceRate}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{stats.onTime}</div>
            <div className="text-sm text-green-800">On Time</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-xl font-bold text-yellow-600">{stats.late}</div>
            <div className="text-sm text-yellow-800">Late</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-sm text-red-800">Absent</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{unmarkedEmployees.length}</div>
            <div className="text-sm text-blue-800">Not Marked</div>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={attendanceRecords}
        loading={loading}
        emptyMessage={`No attendance records found for ${new Date(selectedDate).toLocaleDateString('en-IN')}`}
      />

      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Pending Approval Requests"
        size="lg"
      >
        <ApprovalRequestsModal
          requests={approvalRequests}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={approvingLoading}
          onClose={() => setShowApprovalModal(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={isManualCheckInModalOpen}
        onClose={() => {
          setIsManualCheckInModalOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleManualCheckIn}
        title="Manual Check-In"
        message={`Do you want to manually mark ${selectedEmployee?.name} as checked in? This will override any previous rejection and mark them as present.`}
        confirmText="Confirm Check-In"
        type="warning"
        loading={approvingLoading}
      />

      <ConfirmModal
        isOpen={isManualCheckOutModalOpen}
        onClose={() => {
          setIsManualCheckOutModalOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleManualCheckOut}
        title="Manual Check-Out"
        message={`Do you want to manually mark ${selectedEmployee?.name} as checked out? This will override the rejection and complete their attendance.`}
        confirmText="Confirm Check-Out"
        type="warning"
        loading={approvingLoading}
      />

       {/* ✅ ADD THESE TWO MODALS HERE */}
    <SuccessModal
      isOpen={_isSuccessModalOpen}
      onClose={() => setIsSuccessModalOpen(false)}
      title="Success"
      message={_successMessage}
    />

    </div>
  );
}

// Approval Requests Modal Component
function ApprovalRequestsModal({ 
  requests,
  onApprove,
  onReject,
  loading,
  onClose 
}: {
  requests: ApprovalRequest[];
  onApprove: (employeeId: string, employeeName: string, type: 'check-in' | 'check-out') => Promise<void>;
  onReject: (employeeId: string, employeeName: string, type: 'check-in' | 'check-out') => Promise<void>;
  loading: boolean;
  onClose: () => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">✅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
        <p className="text-gray-500">No pending approval requests at the moment.</p>
        <button
          onClick={onClose}
          className="mt-4 btn-secondary"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        You have {requests.length} pending approval request{requests.length > 1 ? 's' : ''}.
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {requests.map((request, index) => (
          <div 
            key={`${request.employeeId}-${request.type}-${index}`}
            className="border border-orange-200 bg-orange-50 rounded-lg p-4 animate-pulse-slow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  {request.employeeName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-lg">
                    {request.employeeName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {request.employeeId}
                  </div>
                  <div className="text-sm text-orange-700 font-medium mt-1">
                    {request.type === 'check-in' ? '🔔 Requesting Check-In' : '🔔 Requesting Check-Out'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Time: {formatTime(request.time)}
                  </div>
                  {request.isLate && (
                    <div className="text-xs text-red-600 font-medium mt-1">
                      ⚠️ Late arrival - arrived after allowed time
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Approve & Reject */}
              <div className="flex space-x-2">
                {/* Approve Button */}
                <button
                  onClick={() => onApprove(request.employeeId, request.employeeName, request.type)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                    request.type === 'check-in' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Approving...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✓</span>
                      Approve
                    </>
                  )}
                </button>

                {/* Reject Button */}
                <button
                  onClick={() => onReject(request.employeeId, request.employeeName, request.type)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <span className="mr-2">✗</span>
                  Reject
                </button>
                
              </div>
            </div>
          </div>
        ))}
      </div>
      

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Close
        </button>
      </div>
    </div>
  );
}