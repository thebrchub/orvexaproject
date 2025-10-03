import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Table, { StatusBadge, ActionButton } from '../components/Table';
import Modal, { SuccessModal, ConfirmModal } from '../components/Modal';
import DatePicker from '../components/DatePicker';

// Utility functions
const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

// Types matching backend structure
interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
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

export default function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Modal states
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [markingLoading, setMarkingLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // TODO: Once you have the GET attendance endpoint, uncomment this:
      // const attendanceData = await api.getAttendance(selectedDate);
      // setAttendanceRecords(attendanceData);
      
      // TODO: Once you have the GET employees endpoint, uncomment this:
      // const employeesData = await api.getEmployees();
      // setEmployees(employeesData);
      
      // For now, using empty arrays - replace once API is ready
      setAttendanceRecords([]);
      setEmployees([]);
    } catch (error: any) {
      console.error('Failed to load attendance data:', error);
      setErrorMessage(error?.response?.data?.message || 'Failed to load attendance data');
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalEmployees: employees.length,
    present: attendanceRecords.filter(record => record.status === 'present' || record.status === 'late').length,
    absent: attendanceRecords.filter(record => record.status === 'absent').length,
    late: attendanceRecords.filter(record => record.status === 'late').length,
    onTime: attendanceRecords.filter(record => record.status === 'present').length,
  };

  const attendanceRate = stats.totalEmployees > 0 
    ? Math.round((stats.present / stats.totalEmployees) * 100) 
    : 0;

  // Handle marking attendance
  const handleMarkAttendance = async (
    employeeId: string, 
    status: AttendanceRecord['status'], 
    notes?: string
  ) => {
    try {
      setMarkingLoading(true);
      
      // TODO: Once you have the mark attendance endpoint, uncomment this:
      // await api.markAttendance({
      //   employeeId,
      //   date: selectedDate,
      //   status,
      //   notes,
      //   checkIn: status !== 'absent' ? new Date().toISOString() : null,
      // });
      
      // For now, show pending message
      setErrorMessage('Mark attendance API is not yet implemented. Coming soon!');
      setIsErrorModalOpen(true);
      
      // await loadData();
      // setSuccessMessage(`Attendance marked successfully!`);
      // setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Failed to mark attendance:', error);
      setErrorMessage(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to mark attendance. Please try again.'
      );
      setIsErrorModalOpen(true);
    } finally {
      setMarkingLoading(false);
    }
  };

  // Get employees who haven't been marked for attendance today
  const unmarkedEmployees = employees.filter(emp => 
    !attendanceRecords.some(record => record.employeeId === emp.id)
  );

  // Table columns for attendance records
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
            <div className="text-sm text-gray-500">ID: {row.employeeId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'checkIn',
      label: 'Check In',
      width: '15%',
      render: (value: string | null) => (
        <span className={`${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value ? formatTime(value) : 'Not checked in'}
        </span>
      ),
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      width: '15%',
      render: (value: string | null) => (
        <span className={`${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value ? formatTime(value) : 'Not checked out'}
        </span>
      ),
    },
    {
      key: 'workingHours',
      label: 'Working Hours',
      width: '15%',
      render: (value: number) => (
        <span className="font-medium">{value.toFixed(1)}h</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (value: string) => <StatusBadge status={value} type="attendance" />,
    },
    {
      key: 'notes',
      label: 'Notes',
      width: '20%',
      render: (value?: string) => (
        <span className="text-sm text-gray-600 truncate max-w-32 block">
          {value || 'No notes'}
        </span>
      ),
    },
  ];

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Track and manage employee attendance</p>
        </div>
        {isToday && (
          <button 
            onClick={() => setIsMarkAttendanceOpen(true)}
            className="btn-primary flex items-center"
          >
            <span className="mr-2">📋</span>
            Mark Attendance
          </button>
        )}
      </div>

      {/* Date Picker and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Date Picker */}
        <div className="card">
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            label="Select Date"
            maxDate={new Date().toISOString().split('T')[0]}
            className="w-full"
          />
        </div>

        {/* Stats Cards */}
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
      </div>

      {/* Attendance Rate Card */}
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

        {/* Progress Bar */}
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

        {/* Breakdown */}
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
            <div className="text-sm text-blue-800">Unmarked</div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <Table
        columns={columns}
        data={attendanceRecords}
        loading={loading}
        emptyMessage={`No attendance records found for ${new Date(selectedDate).toLocaleDateString('en-IN')}`}
      />

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={isMarkAttendanceOpen}
        onClose={() => setIsMarkAttendanceOpen(false)}
        title="Mark Attendance"
        size="lg"
      >
        <MarkAttendanceForm
          employees={unmarkedEmployees}
          allEmployees={employees}
          onSubmit={handleMarkAttendance}
          onCancel={() => setIsMarkAttendanceOpen(false)}
          loading={markingLoading}
        />
      </Modal>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success"
        message={successMessage}
      />

      {/* Error Modal */}
      <ConfirmModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        onConfirm={() => setIsErrorModalOpen(false)}
        title="Error"
        message={errorMessage}
        confirmText="OK"
        type="danger"
      />
    </div>
  );
}

// Mark Attendance Form Component
function MarkAttendanceForm({ 
  employees,
  allEmployees,
  onSubmit, 
  onCancel, 
  loading 
}: {
  employees: Employee[];
  allEmployees: Employee[];
  onSubmit: (employeeId: string, status: AttendanceRecord['status'], notes?: string) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, {
    status: AttendanceRecord['status'];
    notes: string;
  }>>({});

  const handleEmployeeSelect = (employeeId: string, status: AttendanceRecord['status']) => {
    setSelectedEmployees(prev => ({
      ...prev,
      [employeeId]: { status, notes: prev[employeeId]?.notes || '' }
    }));
  };

  const handleNotesChange = (employeeId: string, notes: string) => {
    setSelectedEmployees(prev => ({
      ...prev,
      [employeeId]: { 
        status: prev[employeeId]?.status || 'present', 
        notes 
      }
    }));
  };

  const handleSubmit = async () => {
    const selectedIds = Object.keys(selectedEmployees);
    if (selectedIds.length === 0) {
      alert('Please select at least one employee and their attendance status');
      return;
    }

    try {
      for (const employeeId of selectedIds) {
        const { status, notes } = selectedEmployees[employeeId];
        await onSubmit(employeeId, status, notes);
      }
      onCancel();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    }
  };

  // If no employees to show
  if (allEmployees.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
        <p className="text-gray-500">Please add employees first to mark attendance.</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">✅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
        <p className="text-gray-500">All employees have been marked for attendance today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Mark attendance for {employees.length} employee{employees.length !== 1 ? 's' : ''} who haven't been marked today.
      </p>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {employees.map(employee => (
          <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  {(employee.fullName || employee.name)?.charAt(0).toUpperCase() || 'E'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{employee.fullName || employee.name}</div>
                  <div className="text-sm text-gray-500">{employee.position || employee.department || 'Employee'}</div>
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(['present', 'late', 'half-day', 'absent'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => handleEmployeeSelect(employee.id, status)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedEmployees[employee.id]?.status === status
                      ? status === 'present' ? 'bg-green-600 text-white' :
                        status === 'late' ? 'bg-yellow-600 text-white' :
                        status === 'half-day' ? 'bg-blue-600 text-white' :
                        'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'half-day' ? 'Half Day' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Notes */}
            {selectedEmployees[employee.id] && (
              <textarea
                placeholder="Add notes (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
                value={selectedEmployees[employee.id]?.notes || ''}
                onChange={(e) => handleNotesChange(employee.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || Object.keys(selectedEmployees).length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          Mark Attendance ({Object.keys(selectedEmployees).length})
        </button>
      </div>
    </div>
  );
}