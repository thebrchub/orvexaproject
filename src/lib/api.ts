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
    
    // Handle format: {"code":400,"message":"Validation failed","details":["Invalid Password!"]}
    if (data?.details && Array.isArray(data.details)) {
      return data.details.join(", ");
    }
    
    // Handle format: {"title":"Constraint Violation","violations":[{"field":"...","message":"..."}]}
    if (data?.violations && Array.isArray(data.violations)) {
      return data.violations.map((v: any) => v.message).join(", ");
    }
    
    // Fallback to message or title
    return data?.message || data?.title || "Unexpected API error";
  }
  return "Unknown error";
};

// ============= AXIOS CONFIGURATION =============
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

// Request interceptor - Add auth token
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
        // Call refresh endpoint with refresh token using POST
        const refreshAxios = axios.create({
          baseURL: BASE_URL,
          headers: { "Content-Type": "application/json" },
        });

        const refreshRes = await refreshAxios.post(`${BASE_URL}/refresh`, {}, {
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
  attendanceStatus: "NOT_MARKED" | "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "CHECKED_IN" | "CHECK_IN_APPROVAL_REQUESTED" | "CHECK_OUT_APPROVAL_REQUESTED" | string;
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
    department?: string;
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
  status: 'present' | 'absent' | 'late' | 'half-day' | 'not-marked' | 'checked-in' | 'check-in-requested' | 'check-out-requested';
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
    'CHECKED_IN': 'checked-in',
    'CHECK_IN_APPROVAL_REQUESTED': 'check-in-requested',
    'CHECK_OUT_APPROVAL_REQUESTED': 'check-out-requested',
  };
  return statusMap[backendStatus] || 'not-marked';
}

/**
 * Calculate working hours from checkIn and checkOut times
 */
function calculateWorkingHours(checkIn: string | null, checkOut: string | null): number {
  if (!checkIn || !checkOut) return 0;
  
  try {
    // Parse time strings (format: HH:MM:SS.nnnnnnnnn)
    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);
    
    const inTotalMinutes = inHours * 60 + inMinutes;
    const outTotalMinutes = outHours * 60 + outMinutes;
    
    const diffMinutes = outTotalMinutes - inTotalMinutes;
    return diffMinutes / 60; // Convert to hours
  } catch (err) {
    console.error('Error calculating working hours:', err);
    return 0;
  }
}

/**
 * Map backend EmployeeResponse to frontend Employee format
 */
function mapEmployeeResponse(emp: EmployeeResponse): Employee {
  return {
    id: emp.email, // Using email as ID since backend uses email as identifier
    employeeId: emp.email,
    email: emp.email,
    mobile: emp.mobile,
    name: emp.name,
    fullName: emp.name,
    doj: emp.doj,
    dob: emp.dob,
    salary: emp.details.salary,
    aadhar: emp.details.aadhar,
    pan: emp.details.pan,
    accountNo: emp.details.accountNo,
    ifsc: emp.details.ifsc,
    position: '',
    department: '',
    status: 'active',
  };
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
      const res = await axios.post(`${BASE_URL}/refresh`, {}, {
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
      console.log(`[API] Approving attendance for: ${employeeEmail}`);
      console.log(`[API] URL: ${BASE_URL}/attendence/approve/${employeeEmail}`);
      
      const res = await axios.post(`${BASE_URL}/attendence/approve/${employeeEmail}`);
      
      console.log(`[API] Approve response:`, res.data);
      return res.data;
    } catch (err: any) {
      console.error(`[API] Approve attendance error:`, err.response?.data || err.message);
      throw new Error(parseApiError(err));
    }
  },

  /**
   * Get attendance records for a specific date, mapped to frontend format
   */
  async getAttendance(date: string): Promise<AttendanceRecord[]> {
    try {
      // Get all attendance records
      const allAttendance = await this.getAllAttendance();
      
      // Get all employees to map names
      const employees = await this.getAllEmployees();
      const employeeMap = new Map(employees.map(emp => [emp.email, emp]));
      
      // Filter by date and map to frontend format
      const filteredAttendance = allAttendance
        .filter(att => att.details.attendanceDate === date)
        .map(att => {
          const employee = employeeMap.get(att.details.employeeEmail);
          const workingHours = att.otHours || calculateWorkingHours(att.checkIn, att.checkOut);
          
          return {
            id: `${att.details.employeeEmail}-${att.details.attendanceDate}`,
            employeeId: att.details.employeeEmail,
            employeeName: employee?.name || att.details.employeeEmail,
            date: att.details.attendanceDate,
            checkIn: att.checkIn,
            checkOut: att.checkOut,
            workingHours: workingHours,
            status: mapAttendanceStatus(att.attendanceStatus),
            notes: undefined,
          };
        });
      
      return filteredAttendance;
    } catch (err) {
      console.error("[API] getAttendance error:", err);
      throw err;
    }
  },

  // ========== EMPLOYEES ==========
  /**
   * Get all employees mapped to frontend format
   */
  async getEmployees(): Promise<Employee[]> {
    try {
      const employees = await this.getAllEmployees();
      return employees.map(mapEmployeeResponse);
    } catch (err) {
      console.error("[API] getEmployees error:", err);
      throw err;
    }
  },

  /**
   * Get all employees (raw backend format)
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
        id: employeeId || employee.email,
        employeeId: employeeId || employee.email,
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
          (att) => att.attendanceStatus === "PRESENT" || att.attendanceStatus === "LATE" || att.attendanceStatus === "CHECKED_IN"
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