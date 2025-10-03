import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate} from '../lib/api';
import type { AddEmployeeRequest } from '../lib/api';
import TableColumn, { StatusBadge, ActionButton } from '../components/Table';
import ModalProps, { ConfirmModal, SuccessModal } from '../components/Modal';
import EmployeeFormProps from '../components/EmployeeForm';

// Extended Employee type to match your backend structure
interface Employee {
  id: string;
  employeeId: string;
  email: string;
  mobile: string;
  name: string;
  firstName: string;
  lastName: string;
  fullName: string;
  doj: string; // Date of Joining
  dob: string; // Date of Birth
  salary: number;
  aadhar: string;
  pan: string;
  accountNo: string;
  ifsc: string;
  
  // Additional fields that might come from backend or be added later
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

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  
  // Selected employee for edit/delete/view
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // TODO: Once you have the GET employees endpoint, uncomment this:
      // const data = await api.getEmployees();
      
      // For now, using mock data - replace this once API is ready
      const mockData: Employee[] = [];
      setEmployees(mockData);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
      setErrorMessage(error?.response?.data?.message || 'Failed to load employees');
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search, department, and status
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || employee.department === selectedDepartment;
    const matchesStatus = !selectedStatus || employee.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Get unique departments and statuses for filters
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  const statuses = [...new Set(employees.map(emp => emp.status).filter(Boolean))];

  // Calculate comprehensive statistics
  const stats = {
    total: employees.length,
    active: employees.filter(emp => emp.status === 'active').length,
    departments: departments.length,
    totalSalaries: employees.reduce((sum, emp) => sum + (emp.salary || 0), 0),
    remoteWorkers: employees.filter(emp => emp.workLocation === 'remote').length,
  };

  // Handle employee creation
  const handleCreateEmployee = async (formData: any) => {
    try {
      setFormLoading(true);
      
      // Map form data to API request format
      const employeeData: AddEmployeeRequest = {
        email: formData.email,
        mobile: formData.phone || formData.mobile,
        id: Date.now(), // Generate temporary ID - backend should handle this
        name: formData.fullName || `${formData.firstName} ${formData.lastName}`,
        doj: formData.joinDate || formData.doj,
        dob: formData.dateOfBirth || formData.dob,
        details: {
          salary: parseFloat(formData.salary) || 0,
          aadhar: formData.aadharNumber || formData.aadhar || '',
          pan: formData.panNumber || formData.pan || '',
          accountNo: parseInt(formData.bankAccount?.accountNumber || formData.accountNo) || 0,
          ifsc: formData.bankAccount?.ifscCode || formData.ifsc || '',
        },
      };
      
      const response = await api.addEmployee(employeeData);
      
      if (response.success) {
        // Reload employees list
        await loadEmployees();
        
        setIsAddModalOpen(false);
        setSuccessMessage(response.message || `Employee ${employeeData.name} added successfully!`);
        setIsSuccessModalOpen(true);
      } else {
        throw new Error(response.message || 'Failed to add employee');
      }
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      setErrorMessage(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to add employee. Please try again.'
      );
      setIsErrorModalOpen(true);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle employee update
  const handleUpdateEmployee = async (formData: any) => {
    if (!selectedEmployee) return;
    
    try {
      setFormLoading(true);
      
      // TODO: Once you have the UPDATE employee endpoint, uncomment and adapt this:
      // const employeeData = {
      //   email: formData.email,
      //   mobile: formData.phone || formData.mobile,
      //   name: formData.fullName || `${formData.firstName} ${formData.lastName}`,
      //   doj: formData.joinDate || formData.doj,
      //   dob: formData.dateOfBirth || formData.dob,
      //   details: {
      //     salary: parseFloat(formData.salary) || 0,
      //     aadhar: formData.aadharNumber || formData.aadhar || '',
      //     pan: formData.panNumber || formData.pan || '',
      //     accountNo: parseInt(formData.bankAccount?.accountNumber || formData.accountNo) || 0,
      //     ifsc: formData.bankAccount?.ifscCode || formData.ifsc || '',
      //   },
      // };
      // await api.updateEmployee(selectedEmployee.id, employeeData);
      
      // For now, show a message that this feature is pending
      setErrorMessage('Update employee API is not yet implemented. Coming soon!');
      setIsErrorModalOpen(true);
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      setErrorMessage(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to update employee. Please try again.'
      );
      setIsErrorModalOpen(true);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle employee deletion
  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      setDeleteLoading(true);
      
      // TODO: Once you have the DELETE employee endpoint, uncomment this:
      // await api.deleteEmployee(selectedEmployee.id);
      
      // For now, show a message that this feature is pending
      setErrorMessage('Delete employee API is not yet implemented. Coming soon!');
      setIsErrorModalOpen(true);
      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      setErrorMessage(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to delete employee. Please try again.'
      );
      setIsErrorModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'employeeId',
      label: 'Employee',
      width: '20%',
      render: (value: string, row: Employee) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
            {row.name?.charAt(0).toUpperCase() || row.firstName?.charAt(0).toUpperCase() || 'E'}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name || row.fullName}</div>
            <div className="text-sm text-gray-500">{value || row.id}</div>
            <div className="text-xs text-gray-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'mobile',
      label: 'Contact',
      width: '15%',
      render: (value: string, row: Employee) => (
        <div>
          <div className="text-sm text-gray-900">{value || row.phone}</div>
          <div className="text-xs text-gray-500">{row.position || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      width: '12%',
      render: (value: string, row: Employee) => (
        <div>
          {value ? (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {value}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Not set</span>
          )}
        </div>
      ),
    },
    {
      key: 'salary',
      label: 'Salary',
      width: '12%',
      render: (value: number) => (
        <div>
          <span className="font-medium text-gray-900">
            {value ? formatCurrency(value) : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'doj',
      label: 'Join Date',
      width: '12%',
      render: (value: string) => (
        <div className="text-sm">{value ? formatDate(value) : 'N/A'}</div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (value: string) => (
        <StatusBadge status={value || 'active'} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '19%',
      render: (_: any, row: Employee) => (
        <div className="flex space-x-1">
          <ActionButton
            icon="👁️"
            label="View"
            onClick={() => {
              setSelectedEmployee(row);
              setIsViewModalOpen(true);
            }}
            variant="secondary"
            size="sm"
          />
          <ActionButton
            icon="✏️"
            label="Edit"
            onClick={() => {
              setSelectedEmployee(row);
              setIsEditModalOpen(true);
            }}
            variant="secondary"
            size="sm"
          />
          <ActionButton
            icon="🗑️"
            label="Delete"
            onClick={() => {
              setSelectedEmployee(row);
              setIsDeleteModalOpen(true);
            }}
            variant="danger"
            size="sm"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage employee records and documentation</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <span className="mr-2">➕</span>
          Add Employee
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 mr-4">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-500">{stats.active} active</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50 mr-4">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Salaries</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSalaries)}</p>
              <p className="text-xs text-gray-500">monthly</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-50 mr-4">
              <span className="text-2xl">🏢</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.departments}</p>
              <p className="text-xs text-gray-500">{stats.remoteWorkers} remote</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50 mr-4">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Salary</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.total > 0 ? formatCurrency(stats.totalSalaries / stats.total) : '₹0'}
              </p>
              <p className="text-xs text-gray-500">per employee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, employee ID, email, phone, or position..."
                className="input-field pl-10"
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
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            {departments.length > 0 && (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="input-field min-w-40"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            )}

            {statuses.length > 0 && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field min-w-32"
              >
                {/* <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))} */}
              </select>
            )}
            
            {(searchTerm || selectedDepartment || selectedStatus) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDepartment('');
                  setSelectedStatus('');
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      {/* Employees Table */}
      <TableColumn
        columns={columns}
        data={filteredEmployees}
        loading={loading}
        emptyMessage="No employees found. Add your first employee to get started!"
      />

      {/* View Employee Modal */}
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

      {/* Add Employee Modal */}
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

      {/* Edit Employee Modal */}
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

      {/* Delete Confirmation Modal */}
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

// Employee Details View Component
function EmployeeDetailsView({ employee }: { employee: Employee }) {
  return (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {/* Basic Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Full Name</label>
            <p className="text-sm text-gray-900">{employee.name || employee.fullName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Employee ID</label>
            <p className="text-sm text-gray-900 font-mono">{employee.employeeId || employee.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <p className="text-sm text-gray-900">{employee.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Mobile</label>
            <p className="text-sm text-gray-900">{employee.mobile || employee.phone}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
            <p className="text-sm text-gray-900">{employee.dob ? formatDate(employee.dob) : 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Date of Joining</label>
            <p className="text-sm text-gray-900">{employee.doj ? formatDate(employee.doj) : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Government Documents */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Government Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Aadhar Number</label>
            <p className="text-sm text-gray-900 font-mono">{employee.aadhar || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">PAN Number</label>
            <p className="text-sm text-gray-900 font-mono">{employee.pan || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Account Number</label>
            <p className="text-sm text-gray-900 font-mono">{employee.accountNo || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">IFSC Code</label>
            <p className="text-sm text-gray-900 font-mono">{employee.ifsc || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Salary Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Salary</label>
            <p className="text-lg font-bold text-green-600">
              {employee.salary ? formatCurrency(employee.salary) : 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* System Information */}
      {(employee.createdAt || employee.updatedAt) && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employee.createdAt && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Created On</label>
                <p className="text-sm text-gray-900">{formatDate(employee.createdAt)}</p>
              </div>
            )}
            {employee.updatedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-sm text-gray-900">{formatDate(employee.updatedAt)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}