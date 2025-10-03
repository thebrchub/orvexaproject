import React, { useState } from "react";
import { api } from "../lib/api";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login with:", { email, password: "***" });
      
      const res = await api.login(email, password);
      console.log("Login response:", res);

      // Check if response has the expected structure
      if (!res || !res.accessToken) {
        console.error("Unexpected response structure:", res);
        throw new Error("Invalid response from server");
      }

      // Save tokens
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      
      console.log("Tokens saved successfully");

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Login error details:", {
        message: err.message,
        response: err.response,
        data: err.response?.data,
        status: err.response?.status,
      });

      // More detailed error messages
      if (err.response) {
        // Server responded with error
        const errorMessage = 
          err.response.data?.message || 
          err.response.data?.error ||
          `Server error: ${err.response.status}`;
        setError(errorMessage);
      } else if (err.request) {
        // Request made but no response
        setError("No response from server. Please check your connection.");
      } else {
        // Something else went wrong
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-2xl rounded-lg p-8 w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏢</div>
          <h2 className="text-3xl font-bold text-gray-800">HRMS Login</h2>
          <p className="text-gray-500 text-sm mt-2">Company & HR Portal</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Email Input */}
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

        {/* Password Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>

        {/* Debug Info (Remove in production) */}
        {import.meta.env.MODE === 'development' && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p className="font-medium mb-1">Debug Info:</p>
            <p>API Base: https://hrms-app-deploy-production.up.railway.app/v1/cmp</p>
            <p>Endpoint: POST /login</p>
        </div>
        )}
      </form>
    </div>
  );
};

export default Login;