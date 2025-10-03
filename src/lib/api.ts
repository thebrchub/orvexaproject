import axios from "axios";

// Base API URL
const BASE_URL = "https://hrms-app-deploy-production.up.railway.app/v1/cmp";

// ============= UTILITY FUNCTIONS =============
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateString: string): string =>
  new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(dateString));

export const formatTime = (timeString: string): string =>
  new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(timeString));

export const toUTC = (date: Date): string => new Date(date).toISOString();

export const parseApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.details && Array.isArray(data.details)) {
      return data.details.join(", ");
    }
    return data?.message || "Unexpected API error";
  }
  return "Unknown error";
};

// ============= AXIOS CONFIGURATION =============
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

// Request interceptor - Add auth token
// Request interceptor
axios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry if 401 and not already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.endsWith("/refresh")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint with refresh token
        const refreshRes = await axios.get(`${BASE_URL}/refresh`, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        const newAccessToken = refreshRes.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        // Update the original request with new access token
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axios(originalRequest); // retry original request
      } catch (refreshError) {
        // If refresh fails, force logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============= TYPE DEFINITIONS =============

// Company
export interface CompanyDetails {
  email: string;
  name: string;
  doc: string; // YYYY-MM-DD
  about: string;
  lastAllowedCheckInTime: string; // HH:MM:SS.nnnnnnnnn
  beginCheckOutTime: string; // HH:MM:SS.nnnnnnnnn
  details: {
    regNumber: string;
    pan: string;
    companyType: string;
  };
}

// Attendance (Backend format)
export interface AttendanceResponse {
  details: {
    employeeEmail: string;
    attendanceDate: string; // YYYY-MM-DD
  };
  checkIn: string | null; // HH:MM:SS.nnnnnnnnn
  checkOut: string | null; // HH:MM:SS.nnnnnnnnn
  attendanceStatus: "NOT_MARKED" | "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | string;
  otHours: number;
}

// Employee (Backend format)
export interface EmployeeResponse {
  email: string;
  mobile: string;
  id: number;
  name: string;
  doj: string; // YYYY-MM-DD
  dob: string; // YYYY-MM-DD
  details: {
    salary: number;
    aadhar: string;
    pan: string;
    accountNo: number;
    ifsc: string;
  };
}

// Authentication
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: {
    email: string;
    name?: string;
  };
}

// Employee (Frontend format - mapped from backend)
export interface AddEmployeeRequest {
  email: string;
  mobile: string;
  id: number;
  name: string;
  doj: string; // YYYY-MM-DD
  dob: string; // YYYY-MM-DD
  details: {
    salary: number;
    aadhar: string;
    pan: string;
    accountNo: number;
    ifsc: string;
  };
}

export interface AddEmployeeResponse {
  success: boolean;
  message: string;
  employeeId?: string;
}

export interface Employee {
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
  accountNo: number;
  ifsc: string;
  position?: string;
  department?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Attendance Record (Frontend format)
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'not-marked';
  notes?: string;
}

export interface AttendanceMarkRequest {
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  checkIn?: string | null;
  checkOut?: string | null;
  notes?: string;
}

// Payroll
export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  baseSalary: number;
  overtime: number;
  deductions: number;
  totalSalary: number;
  daysWorked: number;
  totalDays: number;
  status: 'draft' | 'processed' | 'paid';
  generatedAt: string;
}

export interface GeneratePayrollRequest {
  employeeId: string;
  month: string;
  year: number;
}

// Dashboard
export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  totalSalaryThisMonth: number;
  pendingPayrolls: number;
}

// ============= API FUNCTIONS =============
export const api = {
  // ========== AUTHENTICATION ==========
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const res = await axios.post(`${BASE_URL}/login`, { email, password });
      const { accessToken, refreshToken } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      return { accessToken, refreshToken, user: { email, name: undefined } };
    } catch (err) {
      console.error("[API] login error:", err);
      throw err;
    }
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async changePassword(email: string, oldPassword: string, newPassword: string) {
    try {
      const res = await axios.post(`${BASE_URL}/password/reset`, {
        email,
        oldPassword,
        newPassword,
      });
      return res.data;
    } catch (err) {
      console.error("[API] changePassword error:", err);
      throw err;
    }
  },

  async refreshToken(refreshToken: string) {
    try {
      const res = await axios.get(`${BASE_URL}/refresh`, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      });
      return res.data;
    } catch (err) {
      console.error("[API] refreshToken error:", err);
      throw err;
    }
  },

  // ========== COMPANY ==========
  async getCompanyDetails(): Promise<CompanyDetails> {
    try {
      const res = await axios.get(`${BASE_URL}`);
      return res.data;
    } catch (err) {
      throw new Error(parseApiError(err));
    }
  },

  // ========== ATTENDANCE ==========
  // ========== ATTENDANCE ==========
/**
 * Get all attendance records (for HR dashboard)
 */
async getAllAttendance(): Promise<AttendanceResponse[]> {
  try {
    const res = await axios.get(`${BASE_URL}/attendence`);
    return res.data;
  } catch (err) {
    throw new Error(parseApiError(err));
  }
},

/**
 * Get attendance for a specific employee
 * @param employeeEmail - Employee's email address (used as ID)
 */
async getEmployeeAttendance(employeeEmail: string): Promise<AttendanceResponse> {
  try {
    const res = await axios.get(`${BASE_URL}/attendence/${employeeEmail}`);
    return res.data;
  } catch (err) {
    throw new Error(parseApiError(err));
  }
},

/**
 * Approve attendance for a specific employee
 * @param employeeEmail - Employee's email address (used as ID)
 */
async approveAttendance(employeeEmail: string): Promise<AttendanceResponse> {
  try {
    const res = await axios.get(`${BASE_URL}/attendence/approve/${employeeEmail}`);
    return res.data;
  } catch (err) {
    throw new Error(parseApiError(err));
  }
},

/**
 * Legacy: Map backend format to frontend-friendly AttendanceRecord
 */
async getAttendance(date: string): Promise<AttendanceRecord[]> {
  try {
    const res = await axios.get(`${BASE_URL}/attendence`);
    return res.data.map((att: AttendanceResponse) => ({
      id: att.details.employeeEmail + att.details.attendanceDate,
      employeeId: att.details.employeeEmail,
      employeeName: att.details.employeeEmail, // no name from backend
      date: att.details.attendanceDate,
      checkIn: att.checkIn,
      checkOut: att.checkOut,
      workingHours: att.otHours || 0,
      status: mapAttendanceStatus(att.attendanceStatus),
      notes: undefined,
    }));
  } catch (err) {
    console.error("[API] getAttendance error:", err);
    throw err;
  }
},
  // ========== EMPLOYEES ==========
  /**
   * Get all employees
   */
  async getAllEmployees(): Promise<EmployeeResponse[]> {
    try {
      const res = await axios.get(`${BASE_URL}/emp`);
      return res.data;
    } catch (err) {
      throw new Error(parseApiError(err));
    }
  },

  async getEmployee(employeeId: string): Promise<EmployeeResponse> {
  try {
    const res = await axios.get(`${BASE_URL}/emp/${employeeId}`);
    return res.data;
  } catch (err) {
    throw new Error(parseApiError(err));
  }
},

  /**
   * Add new employee
   */
  async addEmployee(employee: AddEmployeeRequest): Promise<Employee> {
    try {
      const res = await axios.post(`${BASE_URL}/emp`, employee);
      const employeeId = res.data.employeeId;

      // Map request + response to full frontend Employee object
      const newEmployee: Employee = {
        id: employeeId || "",
        employeeId: employeeId || "",
        email: employee.email,
        mobile: employee.mobile,
        name: employee.name,
        fullName: employee.name,
        doj: employee.doj,
        dob: employee.dob,
        salary: employee.details.salary,
        aadhar: employee.details.aadhar,
        pan: employee.details.pan,
        accountNo: employee.details.accountNo,
        ifsc: employee.details.ifsc,
        position: "",
        department: "",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return newEmployee;
    } catch (err) {
      console.error("[API] addEmployee error:", err);
      throw err;
    }
  },


  // TODO: Update and Delete endpoints not yet available
  async updateEmployee(employeeId: string, data: Partial<Employee>) {
    console.warn("[API] updateEmployee not yet implemented on backend");
    throw new Error("Update employee endpoint not available");
  },

  async deleteEmployee(employeeId: string) {
    console.warn("[API] deleteEmployee not yet implemented on backend");
    throw new Error("Delete employee endpoint not available");
  },

  // ========== PAYROLL (MOCK) ==========
  async getPayrollRecords(): Promise<PayrollRecord[]> {
    // TODO: Implement when backend provides payroll endpoints
    console.warn("[API] Payroll endpoints not yet implemented");
    return [];
  },

  async generatePayroll(employeeId: string, month: string, year: number) {
    console.warn("[API] generatePayroll not yet implemented on backend");
    throw new Error("Payroll generation endpoint not available");
  },

  async updatePayrollStatus(payrollId: string, status: PayrollRecord['status']) {
    console.warn("[API] updatePayrollStatus not yet implemented on backend");
    throw new Error("Payroll status update endpoint not available");
  },

  // ========== DASHBOARD (MOCK) ==========
  async getDashboardStats(): Promise<DashboardStats> {
    // Calculate from available data
    try {
      const [employees, attendance] = await Promise.all([
        this.getAllEmployees(),
        this.getAllAttendance(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(
        (att) => att.details.attendanceDate === today
      );

      return {
        totalEmployees: employees.length,
        presentToday: todayAttendance.filter(
          (att) => att.attendanceStatus === "PRESENT" || att.attendanceStatus === "LATE"
        ).length,
        absentToday: todayAttendance.filter((att) => att.attendanceStatus === "ABSENT").length,
        lateToday: todayAttendance.filter((att) => att.attendanceStatus === "LATE").length,
        totalSalaryThisMonth: employees.reduce((sum, emp) => sum + emp.details.salary, 0),
        pendingPayrolls: 0, // Not available from backend yet
      };
    } catch (err) {
      console.error("[API] getDashboardStats error:", err);
      throw err;
    }
  },
};

// ============= HELPER FUNCTIONS =============
/**
 * Map backend attendance status to frontend format
 */
function mapAttendanceStatus(backendStatus: string): AttendanceRecord['status'] {
  const statusMap: Record<string, AttendanceRecord['status']> = {
    'NOT_MARKED': 'not-marked',
    'PRESENT': 'present',
    'ABSENT': 'absent',
    'LATE': 'late',
    'HALF_DAY': 'half-day',
  };
  return statusMap[backendStatus] || 'not-marked';
}