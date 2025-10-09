import React, { useState, useEffect } from 'react';
import type { AddEmployeeRequest } from '../lib/api';

interface EmployeeFormProps {
  employee?: any | null; // Keep for future edit functionality
  onSubmit: (employee: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type FormStep = 'personal' | 'documents' | 'bank' | 'employment';

export default function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
  loading = false,
}: EmployeeFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [showReview, setShowReview] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Information (maps to API)
    fullName: '',
    email: '',
    mobile: '',
    dateOfBirth: '',

    // Government Documents
    aadhar: '',
    pan: '',

    // Bank Details
    accountNumber: '',
    ifsc: '',

    // Employment Details
    joinDate: '',
    salary: '',
    department: '', // <--- new field
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const steps: { id: FormStep; label: string; icon: string }[] = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'bank', label: 'Bank Details', icon: '🏦' },
    { id: 'employment', label: 'Employment', icon: '💼' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Uncomment / adapt if you later want to initialise form from `employee` prop
  // useEffect(() => {
  //   if (employee) { /* ... */ }
  // }, [employee]);

  const validateStep = (step: FormStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'personal') {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
      else if (!/^\d{10}$/.test(formData.mobile.replace(/\s/g, ''))) {
        newErrors.mobile = 'Mobile must be 10 digits';
      }
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (step === 'documents') {
      if (!formData.aadhar.trim()) newErrors.aadhar = 'Aadhar number is required';
      else if (!/^\d{12}$/.test(formData.aadhar.replace(/\s/g, ''))) {
        newErrors.aadhar = 'Aadhar must be 12 digits';
      }
      if (!formData.pan.trim()) newErrors.pan = 'PAN number is required';
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
        newErrors.pan = 'Invalid PAN format (e.g., ABCDE1234F)';
      }
    }

    if (step === 'bank') {
      if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
      else if (!/^\d+$/.test(formData.accountNumber)) {
        newErrors.accountNumber = 'Account number must contain only digits';
      }
      if (!formData.ifsc.trim()) newErrors.ifsc = 'IFSC code is required';
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc)) {
        newErrors.ifsc = 'Invalid IFSC format (e.g., HDFC0001234)';
      }
    }

    if (step === 'employment') {
      if (!formData.joinDate) newErrors.joinDate = 'Join date is required';
      if (!formData.salary) newErrors.salary = 'Salary is required';
      else if (Number(formData.salary) <= 0) newErrors.salary = 'Salary must be positive';
      if (!formData.department.trim()) newErrors.department = 'Department is required'; // <--- new validation
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].id);
      }
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  // handleSubmit accepts optional event so it can be called from modal confirm (no event)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    // Validate current step first
    if (!validateStep(currentStep)) return;

    // Validate all steps
    const allSteps: FormStep[] = ['personal', 'documents', 'bank', 'employment'];
    for (const step of allSteps) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    try {
      // Map formData -> API payload
      const apiData = {
        
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim().replace(/\s/g, ''),
        name: formData.fullName.trim(),
        doj: formData.joinDate,
        dob: formData.dateOfBirth,
        details: {
          salary: parseFloat(formData.salary || '0'),
          aadhar: formData.aadhar.trim().replace(/\s/g, ''),
          pan: formData.pan.trim().toUpperCase(),
          accountNo: Number(formData.accountNumber.trim() || 0),
          ifsc: formData.ifsc.trim().toUpperCase(),
          department: formData.department.trim(), // <--- new field
        },
      };

      await onSubmit(apiData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : index === currentStepIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStepIndex ? '✓' : step.icon}
              </div>
              <span className="text-xs mt-2 whitespace-nowrap">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Steps */}
      <div className="min-h-80">
        {currentStep === 'personal' && (
          <PersonalInfoStep formData={formData} errors={errors} onChange={handleChange} loading={loading} />
        )}
        {currentStep === 'documents' && (
          <DocumentsStep formData={formData} errors={errors} onChange={handleChange} loading={loading} />
        )}
        {currentStep === 'bank' && (
          <BankStep formData={formData} errors={errors} onChange={handleChange} loading={loading} />
        )}
        {currentStep === 'employment' && (
          <EmploymentStep formData={formData} errors={errors} onChange={handleChange} loading={loading} onReview={() => setShowReview(true)} />
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary disabled:opacity-50"
        >
          Cancel
        </button>

        <div className="flex space-x-4">
          {currentStepIndex > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={loading}
              className="btn-secondary disabled:opacity-50"
            >
              ← Previous
            </button>
          )}

          {currentStepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              Next →
            </button>
          ) : (
            // FINAL STEP: show both Review and Submit buttons
            <>
              
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 flex items-center"
              >
                {loading && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Add Employee
              </button>
            </>
          )}
        </div>
      </div>
      {/* Review Modal */}
<ReviewModal
  visible={showReview}
  data={formData}
  onClose={() => setShowReview(false)}
  onConfirm={handleSubmit}
  loading={loading}
/>
      
    </form>
    
  );
}


/* ---------------------------
   Step Components (unchanged, with email warning)
   --------------------------- */

function PersonalInfoStep({ formData, errors, onChange, loading }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">Enter the employee's basic information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            placeholder="John Doe"
            className={`input-field ${errors.fullName ? 'border-red-500' : ''}`}
            value={formData.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            disabled={loading}
          />
          {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            placeholder="john.doe@example.com"
            className={`input-field ${errors.email ? 'border-red-500' : ''}`}
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            disabled={loading}
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}

          {/* WARNING TEXT: crucial email note */}
          {!errors.email && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Please double-check the email — it cannot be changed later.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
          <input
            type="tel"
            placeholder="9876543210"
            className={`input-field ${errors.mobile ? 'border-red-500' : ''}`}
            value={formData.mobile}
            onChange={(e) => onChange('mobile', e.target.value)}
            disabled={loading}
            maxLength={10}
          />
          {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
          <p className="text-xs text-gray-500 mt-1">10-digit mobile number without country code</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
          <input
            type="date"
            className={`input-field ${errors.dateOfBirth ? 'border-red-500' : ''}`}
            value={formData.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            disabled={loading}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dateOfBirth && <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>}
        </div>
      </div>
    </div>
  );
}

function DocumentsStep({ formData, errors, onChange, loading }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Government Documents</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">Required for payroll processing and compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number *</label>
          <input
            type="text"
            placeholder="123456789012"
            className={`input-field ${errors.aadhar ? 'border-red-500' : ''}`}
            value={formData.aadhar}
            onChange={(e) => onChange('aadhar', e.target.value.replace(/\D/g, ''))}
            disabled={loading}
            maxLength={12}
          />
          {errors.aadhar && <p className="text-xs text-red-600 mt-1">{errors.aadhar}</p>}
          <p className="text-xs text-gray-500 mt-1">12-digit Aadhar number</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
          <input
            type="text"
            placeholder="ABCDE1234F"
            className={`input-field ${errors.pan ? 'border-red-500' : ''}`}
            value={formData.pan}
            onChange={(e) => onChange('pan', e.target.value.toUpperCase())}
            disabled={loading}
            maxLength={10}
          />
          {errors.pan && <p className="text-xs text-red-600 mt-1">{errors.pan}</p>}
          <p className="text-xs text-gray-500 mt-1">Format: ABCDE1234F</p>
        </div>
      </div>
    </div>
  );
}

function BankStep({ formData, errors, onChange, loading }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h3>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-green-800">Salary will be credited to this account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
          <input
            type="text"
            placeholder="1234567890"
            className={`input-field ${errors.accountNumber ? 'border-red-500' : ''}`}
            value={formData.accountNumber}
            onChange={(e) => onChange('accountNumber', e.target.value.replace(/\D/g, ''))}
            disabled={loading}
          />
          {errors.accountNumber && <p className="text-xs text-red-600 mt-1">{errors.accountNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code *</label>
          <input
            type="text"
            placeholder="HDFC0001234"
            className={`input-field ${errors.ifsc ? 'border-red-500' : ''}`}
            value={formData.ifsc}
            onChange={(e) => onChange('ifsc', e.target.value.toUpperCase())}
            disabled={loading}
            maxLength={11}
          />
          {errors.ifsc && <p className="text-xs text-red-600 mt-1">{errors.ifsc}</p>}
          <p className="text-xs text-gray-500 mt-1">11-character IFSC code</p>
        </div>
      </div>
    </div>
  );
}

function EmploymentStep({ formData, errors, onChange, loading, onReview }: any) {
  // ✅ Check if all required fields are filled
  const isFormValid =
    formData.joinDate &&
    formData.salary &&
    !errors.joinDate &&
    !errors.salary;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Employment Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date of Joining */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Joining *
          </label>
          <input
            type="date"
            className={`input-field ${errors.joinDate ? "border-red-500" : ""}`}
            value={formData.joinDate}
            onChange={(e) => onChange("joinDate", e.target.value)}
            disabled={loading}
            max={new Date().toISOString().split("T")[0]}
          />
          {errors.joinDate && (
            <p className="text-xs text-red-600 mt-1">{errors.joinDate}</p>
          )}
        </div>

        {/* Monthly Salary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Salary *
          </label>
          <input
            type="number"
            placeholder="50000"
            className={`input-field ${errors.salary ? "border-red-500" : ""}`}
            value={formData.salary}
            onChange={(e) => onChange("salary", e.target.value)}
            disabled={loading}
            min="0"
            step="1000"
          />
          {errors.salary && (
            <p className="text-xs text-red-600 mt-1">{errors.salary}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Enter monthly salary amount in ₹
          </p>
        </div>

        {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <input
              type="text"
              placeholder="e.g., HR, Finance"
              className={`input-field ${errors.department ? 'border-red-500' : ''}`}
              value={formData.department}
              onChange={(e) => onChange('department', e.target.value)}
              disabled={loading}
            />
            {errors.department && (
              <p className="text-xs text-red-600 mt-1">{errors.department}</p>
            )}
          </div>
      </div>

      {/* Almost Done Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-yellow-900 mb-2">Almost Done!</h4>
        <p className="text-sm text-yellow-800 mb-4">
          Review your information and click "Add Employee" to complete the registration.
        </p>

        {/* ✅ Review Button */}
        <button
          type="button"
          onClick={onReview}
          disabled={!isFormValid || loading}
          className={`w-full md:w-auto px-6 py-2 rounded-lg font-medium transition-colors ${
            isFormValid && !loading
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Review Before Submit
        </button>
      </div>
    </div>
  );
}


/* ---------------------------
   Review Modal (rendered via showReview state)
   --------------------------- */
/* NOTE: The modal markup is intentionally placed outside the form return so it can be shown anywhere in the DOM.
   If you'd prefer it inside the main component return, move the following snippet into the return block. */
   
   
export function ReviewModal({ visible, data, onClose, onConfirm, loading }: any) {
  if (!visible) return null;

  // Format currency
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Section data organized for better display
  const sections = [
    {
      title: 'Personal Information',
      icon: '👤',
      fields: [
        { label: 'Full Name', value: data.fullName },
        { label: 'Email', value: data.email },
        { label: 'Mobile', value: data.mobile },
        { label: 'Date of Birth', value: formatDate(data.dateOfBirth) },
      ],
    },
    {
      title: 'Government Documents',
      icon: '📄',
      fields: [
        { label: 'Aadhar Number', value: data.aadhar, format: 'aadhar' },
        { label: 'PAN Number', value: data.pan },
      ],
    },
    {
      title: 'Bank Account Details',
      icon: '🏦',
      fields: [
        { label: 'Account Number', value: data.accountNumber },
        { label: 'IFSC Code', value: data.ifsc },
      ],
    },
    {
      title: 'Employment Information',
      icon: '💼',
      fields: [
        { label: 'Date of Joining', value: formatDate(data.joinDate) },
        { label: 'Monthly Salary', value: data.salary ? formatCurrency(data.salary) : '-' },
        { label: 'Department', value: data.department || '-' }, // <-- added department
      ],
    }
  ];

  // Format Aadhar (XXXX XXXX XXXX)
  const formatAadhar = (aadhar: string) => {
    if (!aadhar) return '-';
    return aadhar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Review Employee Details</h3>
              <p className="text-sm text-gray-500 mt-1">
                Please verify all information before submitting
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">{section.icon}</span>
                  <h4 className="text-lg font-semibold text-gray-900">{section.title}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field, fieldIdx) => (
                    <div key={fieldIdx} className="bg-white rounded p-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {field.label}
                      </label>
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {field.format === 'aadhar'
                          ? formatAadhar(field.value)
                          : field.value || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Warning Box */}
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Email address cannot be changed after submission</li>
                    <li>Please verify all bank details carefully</li>
                    <li>Ensure all government document numbers are correct</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Go Back & Edit
            </button>
            <button
              onClick={() => onConfirm()}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding Employee...
                </>
              ) : (
                <>
                  <span className="mr-2">✓</span>
                  Confirm & Add Employee
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}