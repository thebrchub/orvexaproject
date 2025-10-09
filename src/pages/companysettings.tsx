import React, { useState } from "react";

export default function CompanySettings() {
  const [companyName, setCompanyName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [password, setPassword] = useState("");

  const handleAddDepartment = () => {
    if (departments.length < 10) setDepartments([...departments, ""]);
  };

  const handleDepartmentChange = (index: number, value: string) => {
    const updated = [...departments];
    updated[index] = value;
    setDepartments(updated);
  };

  const handleSave = () => {
    // TODO: integrate API to save company settings
    console.log({ companyName, checkIn, checkOut, departments, password });
    alert("Settings saved (mock)!");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Check-In Time</label>
          <input
            type="time"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Check-Out Time</label>
          <input
            type="time"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Change Password</label>
          <input
            type="password"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Departments</label>
        {departments.map((dep, idx) => (
          <input
            key={idx}
            type="text"
            className="block w-full border-gray-300 rounded-md shadow-sm mb-1"
            value={dep}
            onChange={(e) => handleDepartmentChange(idx, e.target.value)}
          />
        ))}
        <button
          onClick={handleAddDepartment}
          className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + Add Department
        </button>
      </div>

      <button
        onClick={handleSave}
        className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
      >
        Save Settings
      </button>
    </div>
  );
}
