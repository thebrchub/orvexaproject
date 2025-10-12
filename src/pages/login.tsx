// Admin Login Component with DOB Format Conversion
import React, { useState } from "react";
import { api, parseApiError } from "../lib/api";
import { Eye, EyeOff, Info } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert ddmmyyyy format to yyyy-mm-dd format
   * Example: 15031995 -> 1995-03-15
   */
  const convertDOBFormat = (ddmmyyyy: string): string | null => {
    try {
      // Remove any non-digit characters
      const cleaned = ddmmyyyy.replace(/[^0-9]/g, '');
      
      // Check if length is exactly 8 digits
      if (cleaned.length !== 8) {
        return null;
      }

      // Extract day, month, year
      const day = cleaned.substring(0, 2);
      const month = cleaned.substring(2, 4);
      const year = cleaned.substring(4, 8);

      // Validate ranges
      const dayInt = parseInt(day, 10);
      const monthInt = parseInt(month, 10);
      const yearInt = parseInt(year, 10);

      if (isNaN(dayInt) || isNaN(monthInt) || isNaN(yearInt)) {
        return null;
      }

      if (dayInt < 1 || dayInt > 31) {
        return null;
      }

      if (monthInt < 1 || monthInt > 12) {
        return null;
      }

      if (yearInt < 1900 || yearInt > new Date().getFullYear()) {
        return null;
      }

      // Try to create a Date to validate the date
      const testDate = new Date(yearInt, monthInt - 1, dayInt);
      if (
        testDate.getDate() !== dayInt ||
        testDate.getMonth() !== monthInt - 1 ||
        testDate.getFullYear() !== yearInt
      ) {
        return null; // Invalid date (e.g., 31st Feb)
      }

      // Return in yyyy-mm-dd format
      return `${year}-${month}-${day}`;
    } catch (e) {
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert DOB format before sending to backend
      const convertedPassword = convertDOBFormat(password);
      
      if (!convertedPassword) {
        setError("Invalid date format. Please use ddmmyyyy (e.g., 15031995)");
        setLoading(false);
        return;
      }

      console.log("Attempting login with:", { 
        email, 
        passwordInput: password,
        passwordConverted: convertedPassword
      });

      const res = await api.login(email, convertedPassword);

      if (!res || !res.accessToken) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation feedback
  const getPasswordHelperText = () => {
    if (!password) return null;
    
    const cleaned = password.replace(/[^0-9]/g, '');
    
    if (cleaned.length < 8) {
      return (
        <p className="text-sm text-orange-600 mt-1 flex items-center">
          <span className="mr-1">⚠️</span>
          Enter 8 digits (currently {cleaned.length})
        </p>
      );
    }
    
    const converted = convertDOBFormat(cleaned);
    if (!converted) {
      return (
        <p className="text-sm text-red-600 mt-1 flex items-center">
          <span className="mr-1">❌</span>
          Invalid date format
        </p>
      );
    }
    
    // return (
    //   <p className="text-sm text-green-600 mt-1 flex items-center">
    //     <span className="mr-1">✓</span>
    //     Valid date: {converted}
    //   </p>
    // );
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-2xl rounded-lg p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏢</div>
          <h2 className="text-3xl font-bold text-gray-800">HRMS Login</h2>
          <p className="text-gray-500 text-sm mt-2">Company & HR Portal</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="company@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password (Date of Registration)
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              // Only allow numbers
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= 8) {
                setPassword(value);
              }
            }}
            required
            placeholder="ddmmyyyy (e.g., 15031995)"
            maxLength={8}
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          {getPasswordHelperText()}
        </div>

        {/* Info Card */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
          <Info size={18} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Password Format: ddmmyyyy</p>
            <p className="text-blue-700">
              Example: 15th March 1995 = <span className="font-mono font-semibold">15031995</span>
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                     5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 
                     5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            First time login?{" "}
            <span className="text-blue-600 font-semibold">
              Password is Company's Date of Registration
            </span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;