import React, { useState, useEffect } from 'react';
import { api, parseApiError } from '../lib/api';
import type { AddEmployeeRequest } from '../lib/api';
import TableColumn, { StatusBadge, ActionButton } from '../components/Table';
import ModalProps, { ConfirmModal, SuccessModal } from '../components/Modal';
import EmployeeFormProps from '../components/EmployeeForm';
import type { AddEmployeeResponse } from '../lib/api';
import { formatDate, formatCurrency } from '../utils/timeUtils';

interface Employee {
  id: string;
  employeeId: string;
  email: string;
  mobile: string;
  name: string;
  fullName: string;
  doj: string;
  dob: string;
  salary: number;
  aadhar: string;
  pan: string;
  accountNo: string;
  ifsc: string;
  position?: string;
  department?: string;
  employmentType?: string;
  workLocation?: string;
  status?: string;
  salaryType?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeeResponse {
  id: string | number;
  name: string;
  email: string;
  mobile: string;
  doj: string;
  dob: string;
  details: {
    salary: number;
    aadhar: string;
    pan: string;
    accountNo: number;
    ifsc: string;
  };
  position?: string;
  department?: string;
  employmentType?: string;
  workLocation?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortOption, setSortOption] = useState("name");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getAllEmployees();
      
      const mappedEmployees: Employee[] = data.map((emp: EmployeeResponse) => {
        const details = emp.details || { salary: 0, aadhar: '', pan: '', accountNo: 0, ifsc: '' };
        return {
          id: emp.id.toString(),
          employeeId: emp.id.toString(),
          name: emp.name || 'N/A',
          fullName: emp.name || 'N/A',
          email: emp.email || 'N/A',
          mobile: emp.mobile || 'N/A',
          doj: emp.doj || '',
          dob: emp.dob || '',
          salary: details.salary || 0,
          aadhar: details.aadhar || '',
          pan: details.pan || '',
          accountNo: details.accountNo?.toString() || '',
          ifsc: details.ifsc || '',
          status: emp.status || 'active',
          position: emp.position || 'N/A',
          department: emp.department || 'N/A',
          workLocation: emp.workLocation || 'N/A',
        };
      });

      setEmployees(mappedEmployees);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
      setErrorMessage(parseApiError(error));  // ✅ Use parseApiError
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesDept = !selectedDepartment || emp.department === selectedDepartment;
    const matchesStatus = !selectedStatus || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    switch (sortOption) {
      case "name":
        return a.name.localeCompare(b.name);
      case "salary":
        return (b.salary || 0) - (a.salary || 0);
      case "doj":
        return new Date(b.doj).getTime() - new Date(a.doj).getTime();
      default:
        return 0;
    }
  });

  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  const statuses = [...new Set(employees.map(emp => emp.status).filter(Boolean))];

  const stats = {
    total: employees.length,
    active: employees.filter(emp => emp.status === 'active').length,
    departments: departments.length,
    totalSalaries: employees.reduce((sum, emp) => sum + (emp.salary || 0), 0),
    remoteWorkers: employees.filter(emp => emp.workLocation === 'remote').length,
  };

  const handleCreateEmployee = async (formData: any) => {
    try {
      setFormLoading(true);
      console.log('Form Data Received:', JSON.stringify(formData, null, 2));
      
      if (!formData.email || !formData.name) {
        throw new Error('Email and name are required');
      }

      const employeeData: AddEmployeeRequest = {
        ...formData,
        id: Date.now(),
      };

      console.log('Prepared Employee Data:', JSON.stringify(employeeData, null, 2));
      const responseFromApi = await api.addEmployee(employeeData);
      await loadEmployees();

      setIsAddModalOpen(false);
      setSuccessMessage(`Employee ${employeeData.name} added successfully!`);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      setErrorMessage(parseApiError(error));  // ✅ Use parseApiError
      setIsErrorModalOpen(true);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateEmployee = async (formData: any) => {
    setErrorMessage('Update employee API is not yet implemented.');
    setIsErrorModalOpen(true);
  };

  const handleDeleteEmployee = async () => {
    setErrorMessage('Delete employee API is not yet implemented.');
    setIsErrorModalOpen(true);
  };

  const columns = [
    {
      key: "serial",
      label: "S.No",
      width: "6%",
      render: (_: any, __: Employee, index?: number) => (
        <div className="text-sm font-medium text-gray-700">{(index ?? 0) + 1}</div>
      ),
    },
    {
      key: 'employeeId',
      label: 'Employee',
      width: '20%',
      render: (_: string, row: Employee) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
            {row.name?.charAt(0).toUpperCase() || 'E'}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{row.name}</div>
            <div className="text-sm text-gray-500 truncate">{row.employeeId}</div>
            <div className="text-xs text-gray-400 truncate">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'mobile',
      label: 'Contact',
      width: '15%',
      render: (_: string, row: Employee) => (
        <div>
          <div className="text-sm text-gray-900">{row.mobile || row.phone}</div>
          <div className="text-xs text-gray-500">{row.position || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      width: '12%',
      render: (value: string) =>
        value ? <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{value}</span> :
          <span className="text-sm text-gray-400">Not set</span>,
    },
    {
      key: 'salary',
      label: 'Salary',
      width: '12%',
      render: (value: number) => <span className="font-medium text-gray-900">{value ? formatCurrency(value) : 'N/A'}</span>,
    },
    {
      key: 'doj',
      label: 'Join Date',
      width: '12%',
      render: (value: string) => <div className="text-sm">{value ? formatDate(value) : 'N/A'}</div>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (value: string | undefined) => <StatusBadge status={value ?? 'active'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '13%',
      render: (_: any, row: Employee) => (
        <div className="flex space-x-1">
          <ActionButton icon="👁️" label="View" onClick={() => { setSelectedEmployee(row); setIsViewModalOpen(true); }} variant="secondary" size="sm" />
          <ActionButton icon="✏️" label="Edit" onClick={() => { setSelectedEmployee(row); setIsEditModalOpen(true); }} variant="secondary" size="sm" />
          <ActionButton icon="🗑️" label="Delete" onClick={() => { setSelectedEmployee(row); setIsDeleteModalOpen(true); }} variant="danger" size="sm" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-3 sm:p-0">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage employee records and documentation</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center text-sm sm:text-base whitespace-nowrap"
        >
          <span className="mr-2">➕</span>
          Add Employee
        </button>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="card p-3 sm:p-4">
          <div className="flex items-start sm:items-center">
            <div className="p-2 sm:p-3 rounded-full bg-blue-50 mr-2 sm:mr-4 flex-shrink-0">
              <span className="text-lg sm:text-2xl">👥</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Employees</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-500 truncate">{stats.active} active</p>
            </div>
          </div>
        </div>
        
        <div className="card p-3 sm:p-4">
          <div className="flex items-start sm:items-center">
            <div className="p-2 sm:p-3 rounded-full bg-green-50 mr-2 sm:mr-4 flex-shrink-0">
              <span className="text-lg sm:text-2xl">💰</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Salaries</p>
              <p className="text-base sm:text-2xl font-bold text-green-600 truncate">{formatCurrency(stats.totalSalaries)}</p>
              <p className="text-xs text-gray-500">monthly</p>
            </div>
          </div>
        </div>
        
        <div className="card p-3 sm:p-4">
          <div className="flex items-start sm:items-center">
            <div className="p-2 sm:p-3 rounded-full bg-yellow-50 mr-2 sm:mr-4 flex-shrink-0">
              <span className="text-lg sm:text-2xl">🏢</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Departments</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.departments}</p>
              <p className="text-xs text-gray-500 truncate">{stats.remoteWorkers} remote</p>
            </div>
          </div>
        </div>
        
        <div className="card p-3 sm:p-4">
          <div className="flex items-start sm:items-center">
            <div className="p-2 sm:p-3 rounded-full bg-purple-50 mr-2 sm:mr-4 flex-shrink-0">
              <span className="text-lg sm:text-2xl">📊</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Avg Salary</p>
              <p className="text-base sm:text-2xl font-bold text-purple-600 truncate">
                {stats.total > 0 ? formatCurrency(stats.totalSalaries / stats.total) : '₹0'}
              </p>
              <p className="text-xs text-gray-500">per employee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Responsive */}
      <div className="card p-3 sm:p-4">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium"
          >
            <span>Filters & Sort</span>
            <span>{isMobileFiltersOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, ID, email, phone..."
                className="input-field pl-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className={`${isMobileFiltersOpen ? 'flex' : 'hidden'} lg:flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto`}>
            {departments.length > 0 && (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="input-field min-w-full sm:min-w-40 text-sm"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            )}

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="input-field min-w-full sm:min-w-36 text-sm"
            >
              <option value="name">Sort: Name (A–Z)</option>
              <option value="salary">Sort: Salary (High → Low)</option>
              <option value="doj">Sort: Join Date (New → Old)</option>
            </select>
            
            {(searchTerm || selectedDepartment || selectedStatus) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDepartment('');
                  setSelectedStatus('');
                }}
                className="btn-secondary text-sm whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-3 text-xs sm:text-sm text-gray-600">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden lg:block">
        <TableColumn
          columns={columns}
          data={sortedEmployees}
          loading={loading}
          emptyMessage="No employees found."
        />
      </div>

      {/* Mobile Cards - Hidden on desktop */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sortedEmployees.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500">No employees found.</p>
          </div>
        ) : (
          sortedEmployees.map((emp, index) => (
            <div key={emp.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{emp.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{emp.position}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 flex-shrink-0">#{index + 1}</span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex text-sm">
                  <span className="text-gray-500 w-20 flex-shrink-0">Email:</span>
                  <span className="text-gray-900 truncate">{emp.email}</span>
                </div>
                <div className="flex text-sm">
                  <span className="text-gray-500 w-20 flex-shrink-0">Mobile:</span>
                  <span className="text-gray-900">{emp.mobile}</span>
                </div>
                <div className="flex text-sm">
                  <span className="text-gray-500 w-20 flex-shrink-0">Dept:</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {emp.department}
                  </span>
                </div>
                <div className="flex text-sm">
                  <span className="text-gray-500 w-20 flex-shrink-0">Salary:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(emp.salary)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedEmployee(emp); setIsViewModalOpen(true); }}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium"
                >
                  View
                </button>
                <button
                  onClick={() => { setSelectedEmployee(emp); setIsEditModalOpen(true); }}
                  className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals - All responsive */}
      {selectedEmployee && (
        <ModalProps
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Employee Details - ${selectedEmployee.name || selectedEmployee.fullName}`}
          size="xl"
        >
          <EmployeeDetailsView employee={selectedEmployee} />
        </ModalProps>
      )}

      <ModalProps
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Employee"
        size="xl"
      >
        <EmployeeFormProps
          onSubmit={handleCreateEmployee}
          onCancel={() => setIsAddModalOpen(false)}
          loading={formLoading}
        />
      </ModalProps>

      <ModalProps
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee"
        size="xl"
      >
        <EmployeeFormProps
          employee={selectedEmployee}
          onSubmit={handleUpdateEmployee}
          onCancel={() => setIsEditModalOpen(false)}
          loading={formLoading}
        />
      </ModalProps>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee"
        message={`Are you sure you want to delete ${selectedEmployee?.name || selectedEmployee?.fullName}? This action cannot be undone.`}
        confirmText="Delete Employee"
        type="danger"
        loading={deleteLoading}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success"
        message={successMessage}
      />

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

function EmployeeDetailsView({ employee }: { employee: Employee }) {
  return (
    <div className="space-y-4 sm:space-y-6 max-h-96 overflow-y-auto">
      <div className="card p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Full Name</label>
            <p className="text-sm text-gray-900 break-words">{employee.name || employee.fullName}</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Employee ID</label>
            <p className="text-sm text-gray-900 font-mono break-all">{employee.employeeId || employee.id}</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Email</label>
            <p className="text-sm text-gray-900 break-all">{employee.email}</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Mobile</label>
            <p className="text-sm text-gray-900">{employee.mobile || employee.phone}</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Date of Birth</label>
            <p className="text-sm text-gray-900">{employee.dob ? formatDate(employee.dob) : 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Date of Joining</label>
            <p className="text-sm text-gray-900">{employee.doj ? formatDate(employee.doj) : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Government Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Aadhar Number</label>
            <p className="text-sm text-gray-900 font-mono break-all">{employee.aadhar || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">PAN Number</label>
            <p className="text-sm text-gray-900 font-mono break-all">{employee.pan || 'Not provided'}</p>
          </div>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Bank Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Account Number</label>
            <p className="text-sm text-gray-900 font-mono break-all">{employee.accountNo || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">IFSC Code</label>
            <p className="text-sm text-gray-900 font-mono">{employee.ifsc || 'Not provided'}</p>
          </div>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Job Description</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Department</label>
            <p className="text-sm text-gray-900">{employee.department || 'Not assigned'}</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600">Monthly Salary</label>
            <p className="text-sm text-green-600 font-bold">
              {employee.salary ? formatCurrency(employee.salary) : 'Not set'}
            </p>
          </div>
        </div>
      </div>


      {(employee.createdAt || employee.updatedAt) && (
        <div className="card p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {employee.createdAt && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-600">Created On</label>
                <p className="text-sm text-gray-900">{formatDate(employee.createdAt)}</p>
              </div>
            )}
            {employee.updatedAt && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-sm text-gray-900">{formatDate(employee.updatedAt)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}