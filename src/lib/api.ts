import axios from "axios";

// Base API URL
const BASE_URL = "https://hrms-app-deploy-production.up.railway.app/v1/cmp";

// ============= UTILITY FUNCTIONS =============
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateString: string): string =>
  new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateString));

export const formatTime = (timeString: string): string =>
  new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(timeString));

// ============= AXIOS CONFIGURATION =============
// Configure axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Request interceptor for debug
axios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    // console.debug("[DEBUG][REQUEST] URL:", config.url);
    // console.debug("[DEBUG][REQUEST] Method:", config.method);
    // console.debug("[DEBUG][REQUEST] Headers before auth:", config.headers);
    // console.debug("[DEBUG][TOKENS] AccessToken:", accessToken);
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    // console.debug("[DEBUG][REQUEST] Headers after auth:", config.headers);
    return config;
  },
  (error) => {
    console.error("[DEBUG][REQUEST ERROR]:", error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized & not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        // No refresh token, just logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
        return Promise.reject(error);
      }

      try {
        // Call refresh API with a *fresh axios instance* (no interceptors!)
        const refreshAxios = axios.create({
          baseURL: BASE_URL,
          headers: { "Content-Type": "application/json" },
        });

        const refreshRes = await refreshAxios.get(`${BASE_URL}/refresh`, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        const newAccessToken = refreshRes.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        // Update header and retry original request once
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed → logout (no infinite loop!)
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }

    // Any other error
    return Promise.reject(error);
  }
);

// ============= TYPE DEFINITIONS =============

// Authentication
export interface LoginResponse { accessToken: string; refreshToken: string; user?: { email: string; name?: string; }; }

// Employee
export interface AddEmployeeRequest {
  email: string; mobile: string; id: number; name: string; doj: string; dob: string;
  details: { salary: number; aadhar: string; pan: string; accountNo: number; ifsc: string; };
}
export interface AddEmployeeResponse { success: boolean; message: string; employeeId?: string; }
export interface Employee {
  id: string; employeeId: string; email: string; mobile: string; name: string; fullName: string;
  doj: string; dob: string; salary: number; aadhar: string; pan: string; accountNo: string; ifsc: string;
  position?: string; department?: string; status?: string; createdAt?: string; updatedAt?: string;
}

// Attendance
export interface AttendanceRecord {
  id: string; employeeId: string; employeeName: string; date: string;
  checkIn: string | null; checkOut: string | null; workingHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day'; notes?: string;
}
export interface AttendanceMarkRequest { employeeId: string; date: string; status: 'present' | 'absent' | 'late' | 'half-day'; checkIn?: string | null; checkOut?: string | null; notes?: string; }

// Payroll
export interface PayrollRecord {
  id: string; employeeId: string; employeeName: string; month: string; year: number;
  baseSalary: number; overtime: number; deductions: number; totalSalary: number;
  daysWorked: number; totalDays: number; status: 'draft' | 'processed' | 'paid'; generatedAt: string;
}
export interface GeneratePayrollRequest { employeeId: string; month: string; year: number; }

// Dashboard
export interface DashboardStats {
  totalEmployees: number; presentToday: number; absentToday: number; lateToday: number;
  totalSalaryThisMonth: number; pendingPayrolls: number;
}

// ============= MOCK DATA (TEMPORARY) =============
let mockEmployees: Employee[] = [];
let mockAttendance: AttendanceRecord[] = [];
let mockPayroll: PayrollRecord[] = [];

// ============= API FUNCTIONS WITH DEBUG LOGS =============
export const api = {
  // ========== AUTHENTICATION ==========
  async login(email: string, password: string) {
    // console.debug("[API] login called:", email); // DEBUG
    try {
      const res = await axios.post(`${BASE_URL}/login`, { email, password });
      // console.debug("[API] login response:", res.data); // DEBUG
      const { accessToken, refreshToken } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      return { accessToken, refreshToken, user: { email, name: undefined } };
    } catch (err) {
      console.error("[API] login error:", err); // DEBUG
      throw err;
    }
  },
  logout() {
    // console.debug("[API] logout called"); // DEBUG
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  async changePassword(email: string, oldPassword: string, newPassword: string) {
    // console.debug("[API] changePassword called:", email); // DEBUG
    try {
      const res = await axios.post(`${BASE_URL}/password/reset`, { email, oldPassword, newPassword });
      // console.debug("[API] changePassword response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] changePassword error:", err); // DEBUG
      throw err;
    }
  },
  async refreshToken(refreshToken: string) {
    // console.debug("[API] refreshToken called"); // DEBUG
    try {
      const res = await axios.get(`${BASE_URL}/refresh`, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });
      // console.debug("[API] refreshToken response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] refreshToken error:", err); // DEBUG
      throw err;
    }
  },


  // ========== EMPLOYEE MANAGEMENT ==========
  async addEmployee(employee: AddEmployeeRequest): Promise<AddEmployeeResponse> {
    // console.debug("[API] addEmployee called:", employee); // DEBUG
    try {
      const res = await axios.post(`${BASE_URL}/emp`, employee);
      // console.debug("[API] addEmployee response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] addEmployee error:", err); // DEBUG
      throw err;
    }
  },
  async getEmployees(): Promise<Employee[]> {
    // console.debug("[API] getEmployees called"); // DEBUG
    try {
      const res = await axios.get(`${BASE_URL}/emp`);
      // console.debug("[API] getEmployees response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] getEmployees error:", err); // DEBUG
      throw err;
    }
  },
  async updateEmployee(employeeId: string, data: Partial<Employee>) {
    // console.debug("[API] updateEmployee called:", { employeeId, data }); // DEBUG
    try {
      const res = await axios.put(`${BASE_URL}/emp/${employeeId}`, data);
      // console.debug("[API] updateEmployee response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] updateEmployee error:", err); // DEBUG
      throw err;
    }
  },
  async deleteEmployee(employeeId: string) {
    // console.debug("[API] deleteEmployee called:", employeeId); // DEBUG
    try {
      const res = await axios.delete(`${BASE_URL}/emp/${employeeId}`);
      // console.debug("[API] deleteEmployee response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] deleteEmployee error:", err); // DEBUG
      throw err;
    }
  },

  // ========== ATTENDANCE MANAGEMENT ==========
  async getAttendance(date: string): Promise<AttendanceRecord[]> {
    // console.debug("[API] getAttendance called:", date); // DEBUG
    try {
      const res = await axios.get(`${BASE_URL}/attendance`, { params: { date } });
      // console.debug("[API] getAttendance response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] getAttendance error:", err); // DEBUG
      throw err;
    }
  },
  async markAttendance(data: AttendanceMarkRequest) {
    // console.debug("[API] markAttendance called:", data); // DEBUG
    try {
      const res = await axios.post(`${BASE_URL}/attendance`, data);
      // console.debug("[API] markAttendance response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] markAttendance error:", err); // DEBUG
      throw err;
    }
  },

  // ========== PAYROLL MANAGEMENT ==========
  async getPayrollRecords(): Promise<PayrollRecord[]> {
    // console.debug("[API] getPayrollRecords called"); // DEBUG
    try {
      const res = await axios.get(`${BASE_URL}/payroll`);
      // console.debug("[API] getPayrollRecords response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] getPayrollRecords error:", err); // DEBUG
      throw err;
    }
  },
  async generatePayroll(employeeId: string, month: string, year: number) {
    // console.debug("[API] generatePayroll called:", { employeeId, month, year }); // DEBUG
    try {
      const res = await axios.post(`${BASE_URL}/payroll/generate`, { employeeId, month, year });
      // console.debug("[API] generatePayroll response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] generatePayroll error:", err); // DEBUG
      throw err;
    }
  },
  async updatePayrollStatus(payrollId: string, status: PayrollRecord['status']) {
    // console.debug("[API] updatePayrollStatus called:", { payrollId, status }); // DEBUG
    try {
      const res = await axios.patch(`${BASE_URL}/payroll/${payrollId}`, { status });
      // console.debug("[API] updatePayrollStatus response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] updatePayrollStatus error:", err); // DEBUG
      throw err;
    }
  },

  // ========== DASHBOARD STATISTICS ==========
  async getDashboardStats(): Promise<DashboardStats> {
    // console.debug("[API] getDashboardStats called"); // DEBUG
    try {
      const res = await axios.get(`${BASE_URL}/dashboard/stats`);
      // console.debug("[API] getDashboardStats response:", res.data); // DEBUG
      return res.data;
    } catch (err) {
      console.error("[API] getDashboardStats error:", err); // DEBUG
      throw err;
    }
  },
};
