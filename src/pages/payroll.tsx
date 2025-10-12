import { useState, useEffect } from 'react';
import { api, formatCurrency, parseApiError } from '../lib/api';
import type { PayrollRecord, Employee,  } from '../lib/api';
import Table, { StatusBadge, ActionButton } from '../components/Table';
import Modal, { ConfirmModal, SuccessModal } from '../components/Modal';

export default function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long' });
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Modal states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');  // ✅ Add this
  const [generateLoading, setGenerateLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payrollData, employeesData] = await Promise.all([
        api.getPayrollRecords(),
        api.getEmployees()
      ]);
      setPayrollRecords(payrollData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to load payroll data:', error);
      setErrorMessage(parseApiError(error));  // ✅ Use parseApiError
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter payroll records by selected month and year
  const filteredRecords = payrollRecords.filter(record => 
    record.month === selectedMonth && record.year === selectedYear
  );

  // Calculate totals
  const totals = filteredRecords.reduce(
    (acc, record) => ({
      baseSalary: acc.baseSalary + record.baseSalary,
      overtime: acc.overtime + record.overtime,
      deductions: acc.deductions + record.deductions,
      totalSalary: acc.totalSalary + record.totalSalary,
    }),
    { baseSalary: 0, overtime: 0, deductions: 0, totalSalary: 0 }
  );

  // Get employees who don't have payroll for selected month/year
  const employeesWithoutPayroll = employees.filter(emp => 
    !filteredRecords.some(record => record.employeeId === emp.id)
  );

  // Generate months array
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years array (current year and previous 2 years)
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  // Handle payroll generation
  const handleGeneratePayroll = async (employeeId: string) => {
    try {
      setGenerateLoading(true);
      await api.generatePayroll(employeeId, selectedMonth, selectedYear);
      await loadData();
      setIsGenerateModalOpen(false);
      setSuccessMessage('Payroll generated successfully!');
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error('Failed to generate payroll:', error);
      setErrorMessage(parseApiError(error));  // ✅ Use parseApiError
      setIsErrorModalOpen(true);
    } finally {
      setGenerateLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'employeeName',
      label: 'Employee',
      width: '20%',
      render: (value: string, row: PayrollRecord) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">ID: {row.employeeId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'baseSalary',
      label: 'Base Salary',
      width: '12%',
      render: (value: number) => (
        <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'overtime',
      label: 'Overtime',
      width: '10%',
      render: (value: number) => (
        <span className={`font-medium ${value > 0 ? 'text-green-600' : 'text-gray-400'}`}>
          {value > 0 ? `+${formatCurrency(value)}` : formatCurrency(0)}
        </span>
      ),
    },
    {
      key: 'deductions',
      label: 'Deductions',
      width: '10%',
      render: (value: number) => (
        <span className={`font-medium ${value > 0 ? 'text-red-600' : 'text-gray-400'}`}>
          {value > 0 ? `-${formatCurrency(value)}` : formatCurrency(0)}
        </span>
      ),
    },
    {
      key: 'totalSalary',
      label: 'Net Salary',
      width: '12%',
      render: (value: number) => (
        <span className="font-bold text-lg text-gray-900">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'daysWorked',
      label: 'Days Worked',
      width: '10%',
      render: (value: number, row: PayrollRecord) => (
        <span className="text-sm">
          {value}/{row.totalDays}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (value: string) => <StatusBadge status={value} type="payroll" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '16%',
      render: (_: any, row: PayrollRecord) => (
        <div className="flex space-x-2">
          <ActionButton
            icon="📄"
            label="View Slip"
            onClick={() => generatePayslip(row)}
            variant="primary"
            size="sm"
          />
          <ActionButton
            icon="📧"
            label="Email"
            onClick={() => emailPayslip(row)}
            variant="secondary"
            size="sm"
          />
        </div>
      ),
    },
  ];

  const generatePayslip = (record: PayrollRecord) => {
    // This would generate a PDF payslip
    console.log('Generating payslip for:', record.employeeName);
    alert('Payslip generation feature will be implemented in the full version!');
  };

  const emailPayslip = (record: PayrollRecord) => {
    // This would email the payslip
    console.log('Emailing payslip to:', record.employeeName);
    alert('Email payslip feature will be implemented in the full version!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-1">Generate and manage employee salary payments</p>
        </div>
        {employeesWithoutPayroll.length > 0 && (
          <button 
            onClick={() => setIsGenerateModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <span className="mr-2">💰</span>
            Generate Payroll
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 mr-4">
              <span className="text-2xl">💵</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Base Salary</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.baseSalary)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50 mr-4">
              <span className="text-2xl">⏰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Overtime</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totals.overtime)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-50 mr-4">
              <span className="text-2xl">➖</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deductions</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totals.deductions)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50 mr-4">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Net Payable</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(totals.totalSalary)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Payroll Records</h2>
          <div className="flex space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field min-w-32"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input-field min-w-24"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Status Overview */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {selectedMonth} {selectedYear} Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {filteredRecords.filter(r => r.status === 'paid').length}
            </div>
            <div className="text-sm text-green-800">Paid</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {filteredRecords.filter(r => r.status === 'processed').length}
            </div>
            <div className="text-sm text-blue-800">Processed</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredRecords.filter(r => r.status === 'draft').length}
            </div>
            <div className="text-sm text-yellow-800">Draft</div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <Table
        columns={columns}
        data={filteredRecords}
        loading={loading}
        emptyMessage={`No payroll records found for ${selectedMonth} ${selectedYear}`}
      />

      {/* Generate Payroll Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title={`Generate Payroll - ${selectedMonth} ${selectedYear}`}
        size="lg"
      >
        <GeneratePayrollForm
          employees={employeesWithoutPayroll}
          month={selectedMonth}
          year={selectedYear}
          onSubmit={handleGeneratePayroll}
          onCancel={() => setIsGenerateModalOpen(false)}
          loading={generateLoading}
        />
      </Modal>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success"
        message={successMessage}
      />
      {/* Error Modal - ADD THIS */}
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

// Generate Payroll Form Component
function GeneratePayrollForm({ 
  employees, 
  month,
  year,
  onSubmit, 
  onCancel, 
  loading 
}: {
  employees: Employee[];
  month: string;
  year: number;
  onSubmit: (employeeId: string) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(employees.map(emp => emp.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleEmployeeToggle = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
    setSelectAll(newSelected.size === employees.length);
  };

  const handleSubmit = async () => {
    if (selectedEmployees.size === 0) {
      alert('Please select at least one employee');
      return;
    }

    try {
      for (const employeeId of selectedEmployees) {
        await onSubmit(employeeId);
      }
    } catch (error) {
      console.error('Failed to generate payroll:', error);
    }
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">✅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Done!</h3>
        <p className="text-gray-500">
          Payroll has been generated for all employees for {month} {year}.
        </p>
      </div>
    );
  }

  const totalSalary = employees
    .filter(emp => selectedEmployees.has(emp.id))
    .reduce((sum, emp) => sum + emp.salary, 0);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Payroll Generation</h3>
        <p className="text-sm text-blue-700">
          Generate payroll for {employees.length} employee{employees.length !== 1 ? 's' : ''} 
          who don't have payroll records for {month} {year}.
        </p>
      </div>

      {/* Summary */}
      {selectedEmployees.size > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">
              Selected: {selectedEmployees.size} employee{selectedEmployees.size !== 1 ? 's' : ''}
            </span>
            <span className="font-bold text-lg text-purple-600">
              {formatCurrency(totalSalary)}
            </span>
          </div>
        </div>
      )}

      {/* Employee Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <span className="font-medium text-gray-900">Select Employees</span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectAll ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {employees.map(employee => (
            <div
              key={employee.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                selectedEmployees.has(employee.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleEmployeeToggle(employee.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.has(employee.id)}
                    onChange={() => handleEmployeeToggle(employee.id)}
                    className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {employee.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{employee.fullName}</div>
                    <div className="text-sm text-gray-500">
                      {employee.position} • {employee.department}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(employee.salary)}</div>
                  <div className="text-sm text-gray-500">Monthly Salary</div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
          disabled={loading || selectedEmployees.size === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          Generate Payroll ({selectedEmployees.size})
        </button>
      </div>
    </div>
  );
}