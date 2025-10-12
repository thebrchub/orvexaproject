import { useState, useEffect } from "react";
import { api, parseApiError } from '../lib/api';
import type { CompanyDetails } from '../lib/api';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

// Success Modal Component
function SuccessModal({ isOpen, onClose, title, message }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in">
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
            <span className="text-4xl">✓</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h3>
          <p className="text-gray-600 text-center mb-6">{message}</p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorModal({ isOpen, onClose, title, message }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in">
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h3>
          <p className="text-gray-600 text-center mb-6">{message}</p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// // Helper function to convert 12-hour format to LocalTime (HH:MM:SS)
// const _convertTo24Hour = (time: string, period: "AM" | "PM"): string => {
//   const [hours, minutes] = time.split(':');
//   let hour = parseInt(hours);
  
//   if (period === "PM" && hour !== 12) {
//     hour += 12;
//   } else if (period === "AM" && hour === 12) {
//     hour = 0;
//   }
  
//   return `${hour.toString().padStart(2, '0')}:${minutes}:00`;
// };

// // Helper function to convert LocalTime (HH:MM:SS) to 12-hour format
// const _convertTo12Hour = (time: string): { time: string; period: "AM" | "PM" } => {
//   const [hoursStr, minutes] = time.split(':');
//   let hours = parseInt(hoursStr);
//   const period: "AM" | "PM" = hours >= 12 ? "PM" : "AM";
  
//   if (hours > 12) {
//     hours -= 12;
//   } else if (hours === 0) {
//     hours = 12;
//   }
  
//   return {
//     time: `${hours.toString().padStart(2, '0')}:${minutes}`,
//     period
//   };
// };

// ✅ NEW: Convert local time to UTC
const convertLocalTimeToUTC = (time: string, period: "AM" | "PM"): string => {
  // Create a date object for today with the given time
  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);
  
  if (period === "PM" && hour !== 12) {
    hour += 12;
  } else if (period === "AM" && hour === 12) {
    hour = 0;
  }
  
  const localDate = new Date();
  localDate.setHours(hour, parseInt(minutes), 0, 0);
  
  // Get UTC hours and minutes
  const utcHours = localDate.getUTCHours();
  const utcMinutes = localDate.getUTCMinutes();
  
  return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}:00`;
};

// ✅ NEW: Convert UTC time to local
const convertUTCToLocalTime = (utcTime: string): { time: string; period: "AM" | "PM" } => {
  // Parse UTC time
  const [utcHours, utcMinutes] = utcTime.split(':').map(Number);
  
  // Create a UTC date
  const utcDate = new Date();
  utcDate.setUTCHours(utcHours, utcMinutes, 0, 0);
  
  // Get local hours and minutes
  const localHours = utcDate.getHours();
  const localMinutes = utcDate.getMinutes();
  
  // Convert to 12-hour format
  const period: "AM" | "PM" = localHours >= 12 ? "PM" : "AM";
  let displayHours = localHours % 12;
  if (displayHours === 0) displayHours = 12;
  
  return {
    time: `${displayHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`,
    period
  };
};

export default function CompanySettings() {
  // Basic Company Information (from API)
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [aboutCompany, setAboutCompany] = useState("");
  const [dateOfIncorporation, setDateOfIncorporation] = useState("");
  
  // Registration Details (from API)
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [companyType, setCompanyType] = useState("");
  
  // Attendance Settings (from API)
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("06:00");
  const [checkInPeriod, setCheckInPeriod] = useState<"AM" | "PM">("AM");
  const [checkOutPeriod, setCheckOutPeriod] = useState<"AM" | "PM">("PM");
  
  // Departments (from API)
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Fields without API (kept as local state)
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [lateCheckInThreshold, setLateCheckInThreshold] = useState("15");
  const [halfDayThreshold, setHalfDayThreshold] = useState("4");
  const [weeklyOffDays, setWeeklyOffDays] = useState(["Saturday", "Sunday"]);
  const [annualLeaves, setAnnualLeaves] = useState("12");
  const [sickLeaves, setSickLeaves] = useState("7");
  const [casualLeaves, setCasualLeaves] = useState("7");
  
  // Password Change
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Modal states
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load company data on mount
  useEffect(() => {
    loadCompanyData();
  }, []);

    const loadCompanyData = async () => {
        try {
            setLoading(true);
            const data = await api.getCompanyDetails();
            
            console.log('Loaded Company Data:', data);
            
            // Map API data to state
            setCompanyName(data.name || "");
            setCompanyEmail(data.email || "");
            setAboutCompany(data.about || "");
            setDateOfIncorporation(data.doc || "");
            setDepartments(data.departments || []);
            
            // Registration details
            setRegistrationNumber(data.details?.regNumber || "");
            setPanNumber(data.details?.pan || "");
            setCompanyType(data.details?.companyType || "");
            
            // ✅ FIXED: Convert UTC times from backend to local time for display
            if (data.lastAllowedCheckInTime) {
            const checkIn = convertUTCToLocalTime(data.lastAllowedCheckInTime);
            setCheckInTime(checkIn.time);
            setCheckInPeriod(checkIn.period);
            console.log(`Check-in time: UTC ${data.lastAllowedCheckInTime} -> Local ${checkIn.time} ${checkIn.period}`);
            }
            
            if (data.beginCheckOutTime) {
            const checkOut = convertUTCToLocalTime(data.beginCheckOutTime);
            setCheckOutTime(checkOut.time);
            setCheckOutPeriod(checkOut.period);
            console.log(`Check-out time: UTC ${data.beginCheckOutTime} -> Local ${checkOut.time} ${checkOut.period}`);
            }
            
        } catch (err: any) {
            console.error('Failed to load company data:', err);
            setErrorMessage(parseApiError(err));
            setIsErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

  const handleAddDepartment = () => {
    if (departments.length < 20) {
      setDepartments([...departments, ""]);
    }
  };

  const handleRemoveDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const handleDepartmentChange = (index: number, value: string) => {
    const updated = [...departments];
    updated[index] = value;
    setDepartments(updated);
  };

  const toggleWeeklyOff = (day: string) => {
    if (weeklyOffDays.includes(day)) {
      setWeeklyOffDays(weeklyOffDays.filter(d => d !== day));
    } else {
      setWeeklyOffDays([...weeklyOffDays, day]);
    }
  };

  const validatePasswordChange = (): boolean => {
    if (oldPassword && (!newPassword || !confirmPassword)) {
      setErrorMessage("Please enter both new password and confirm password");
      setIsErrorModalOpen(true);
      return false;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match");
      setIsErrorModalOpen(true);
      return false;
    }
    if (newPassword && newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long");
      setIsErrorModalOpen(true);
      return false;
    }
    return true;
  };

    const handleSave = async () => {
        if (!validatePasswordChange()) return;
        
        // Validate required fields
        if (!companyName || !companyEmail || !dateOfIncorporation) {
            setErrorMessage("Please fill in all required fields (Company Name, Email, Date of Incorporation)");
            setIsErrorModalOpen(true);
            return;
        }

        // Filter out empty departments
        const validDepartments = departments.filter(dept => dept.trim() !== "");
        if (validDepartments.length === 0) {
            setErrorMessage("Please add at least one department");
            setIsErrorModalOpen(true);
            return;
        }
        
        setSaving(true);
        
        try {
            // Handle password change if provided
            if (oldPassword && newPassword) {
            await api.changePassword(companyEmail, oldPassword, newPassword);
            }

            // ✅ FIXED: Convert local times to UTC before sending to backend
            const checkInUTC = convertLocalTimeToUTC(checkInTime, checkInPeriod);
            const checkOutUTC = convertLocalTimeToUTC(checkOutTime, checkOutPeriod);
            
            console.log(`Sending check-in: Local ${checkInTime} ${checkInPeriod} -> UTC ${checkInUTC}`);
            console.log(`Sending check-out: Local ${checkOutTime} ${checkOutPeriod} -> UTC ${checkOutUTC}`);

            // Prepare company data for API
            const companyData: CompanyDetails = {
            email: companyEmail,
            name: companyName,
            doc: dateOfIncorporation,
            about: aboutCompany || undefined,
            departments: validDepartments,
            lastAllowedCheckInTime: checkInUTC, // ✅ Now in UTC
            beginCheckOutTime: checkOutUTC,     // ✅ Now in UTC
            details: {
                regNumber: registrationNumber || undefined,
                pan: panNumber || undefined,
                companyType: companyType || undefined,
            }
            };

            console.log('Saving Company Data:', companyData);
            
            // Update company details
            await api.updateCompanyDetails(companyData);
            
            setSuccessMessage("Company settings saved successfully!");
            setIsSuccessModalOpen(true);
            
            // Clear password fields if they were filled
            if (oldPassword && newPassword) {
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            }
            
            // Reload data to ensure sync
            await loadCompanyData();
            
        } catch (err: any) {
            console.error('Failed to save company settings:', err);
            setErrorMessage(parseApiError(err));
            setIsErrorModalOpen(true);
        } finally {
            setSaving(false);
        }
    };

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const companyTypes = ["Private Limited", "Public Limited", "Partnership", "Sole Proprietorship", "LLP"];

  const tabs = [
    { id: "general", label: "General", icon: "🏢" },
    { id: "attendance", label: "Attendance", icon: "⏰" },
    { id: "leaves", label: "Leaves", icon: "🌴" },
    { id: "security", label: "Security", icon: "🔒" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-black">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-black font-bold mb-2">Company Settings</h1>
            <p className="text-gray-600">
              Manage your company information and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm p-2">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8">
          {/* General Info Tab */}
          {activeTab === "general" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-blue-600">📋</span>
                  Company Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Company Name *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ABC Technologies Pvt Ltd"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Company Email *</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="info@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                    <p className="text-xs text-amber-600">⚠️ Not yet connected to API</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Date of Incorporation *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      value={dateOfIncorporation}
                      onChange={(e) => setDateOfIncorporation(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Company Address</label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                      rows={3}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="123, Business Park, Tech City"
                    />
                    <p className="text-xs text-amber-600">⚠️ Not yet connected to API</p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700">About Company</label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                      rows={4}
                      value={aboutCompany}
                      onChange={(e) => setAboutCompany(e.target.value)}
                      placeholder="Brief description about your company..."
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 text-purple-600">📄</span>
                  Registration Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Registration Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="U12345DL2020PTC123456"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">PAN Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none uppercase"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">GST Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none uppercase"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="22ABCDE1234F1Z5"
                      maxLength={15}
                    />
                    <p className="text-xs text-amber-600">⚠️ Not yet connected to API</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Company Type</label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value)}
                    >
                      <option value="">Select Type</option>
                      {companyTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 text-green-600">🏛️</span>
                  Departments *
                </h3>
                <div className="space-y-3">
                  {departments.map((dept, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        value={dept}
                        onChange={(e) => handleDepartmentChange(idx, e.target.value)}
                        placeholder={`Department ${idx + 1}`}
                      />
                      <button
                        onClick={() => handleRemoveDepartment(idx)}
                        className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {departments.length < 20 && (
                    <button
                      onClick={handleAddDepartment}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-semibold"
                    >
                      + Add Department
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className="font-semibold text-blue-900">Timezone Information</p>
                    <p className="text-sm text-blue-700 mt-1">Times are in your local timezone and will be converted to UTC for storage.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Last Allowed Check-In Time *</label>
                  <div className="flex space-x-3">
                    <input
                      type="time"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                    />
                    <select
                      value={checkInPeriod}
                      onChange={(e) => setCheckInPeriod(e.target.value as "AM" | "PM")}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white text-gray-700 font-medium"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Last allowed time for check-in</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Begin Check-Out Time *</label>
                  <div className="flex space-x-3">
                    <input
                      type="time"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                    />
                    <select
                      value={checkOutPeriod}
                      onChange={(e) => setCheckOutPeriod(e.target.value as "AM" | "PM")}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white text-gray-700 font-medium"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Earliest time for check-out</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Late Threshold (Minutes)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    value={lateCheckInThreshold}
                    onChange={(e) => setLateCheckInThreshold(e.target.value)}
                    min="0"
                  />
                  <p className="text-xs text-gray-500">Grace period after check-in time</p>
                  <p className="text-xs text-amber-600">⚠️ Not yet connected to API</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Half-Day Hours</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    value={halfDayThreshold}
                    onChange={(e) => setHalfDayThreshold(e.target.value)}
                    min="0"
                    step="0.5"
                  />
                  <p className="text-xs text-gray-500">Minimum hours for half-day</p>
                  <p className="text-xs text-amber-600">⚠️ Not yet connected to API</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaves Tab */}
          {activeTab === "leaves" && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-100 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-900">Coming Soon</p>
                    <p className="text-sm text-amber-700 mt-1">Leave management features are not yet connected to the API. Changes here will be saved locally only.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 text-green-600">📊</span>
                  Leave Allocation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                    <label className="text-sm font-semibold text-blue-900">Annual Leaves</label>
                    <input
                      type="number"
                      className="w-full mt-2 px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
                      value={annualLeaves}
                      onChange={(e) => setAnnualLeaves(e.target.value)}
                      min="0"
                    />
                    <p className="text-xs text-blue-600 mt-2">Days per year</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
                    <label className="text-sm font-semibold text-orange-900">Sick Leaves</label>
                    <input
                      type="number"
                      className="w-full mt-2 px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all outline-none bg-white"
                      value={sickLeaves}
                      onChange={(e) => setSickLeaves(e.target.value)}
                      min="0"
                    />
                    <p className="text-xs text-orange-600 mt-2">Days per year</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                    <label className="text-sm font-semibold text-purple-900">Casual Leaves</label>
                    <input
                      type="number"
                      className="w-full mt-2 px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none bg-white"
                      value={casualLeaves}
                      onChange={(e) => setCasualLeaves(e.target.value)}
                      min="0"
                    />
                    <p className="text-xs text-purple-600 mt-2">Days per year</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 text-indigo-600">📅</span>
                  Weekly Off Days
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleWeeklyOff(day)}
                      className={`px-4 py-4 rounded-xl font-semibold transition-all ${
                        weeklyOffDays.includes(day)
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      <div className="text-sm">{day}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="font-semibold text-yellow-900">Security Notice</p>
                    <p className="text-sm text-yellow-700 mt-1">For security reasons, you need to enter your current password to set a new one.</p>
                  </div>
                </div>
              </div>

              <div className="max-w-md space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-gray-500">Minimum 6 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">💾</span>
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success"
        message={successMessage}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="Error"
        message={errorMessage}
      />
    </div>
  );
}