import React from 'react';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  className?: string;
}

export default function Table({ 
  columns, 
  data, 
  loading = false, 
  onRowClick,
  emptyMessage = "No data available",
  className = ""
}: TableProps) {
  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`card text-center py-12 ${className}`}>
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr
                key={index}
                className={`${
                  onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-150' : ''
                }`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(row[column.key], row) : (
                      <div className="text-sm text-gray-900">{row[column.key]}</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Status Badge Component - useful for tables
// Status Badge Component - useful for tables
export function StatusBadge({ status, type = 'default' }: { status?: string; type?: 'default' | 'attendance' | 'payroll' }) {
  const displayStatus = status?.toLowerCase() ?? 'active'; // default fallback

  const getStatusStyles = () => {
    if (type === 'attendance') {
      switch (displayStatus) {
        case 'present':
          return 'status-present';
        case 'absent':
          return 'status-absent';
        case 'late':
          return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium';
        case 'half-day':
          return 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium';
        default:
          return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium';
      }
    }

    if (type === 'payroll') {
      switch (displayStatus) {
        case 'paid':
          return 'status-present';
        case 'processed':
          return 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium';
        case 'draft':
          return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium';
        default:
          return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium';
      }
    }

    // Default employee status
    switch (displayStatus) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium';
    }
  };

  return (
    <span className={getStatusStyles()}>
      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
    </span>
  );
}


// Action Button Component - useful for table actions
export function ActionButton({ 
  onClick, 
  icon, 
  label, 
  variant = 'primary',
  size = 'sm' 
}: { 
  onClick: () => void;
  icon: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
}) {
  const getButtonStyles = () => {
    const baseStyles = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2';
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium`;
      case 'secondary':
        return `${baseStyles} bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200 font-medium`;
      case 'danger':
        return `${baseStyles} bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium`;
      default:
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium`;
    }
  };

  return (
    <button
      onClick={onClick}
      className={getButtonStyles()}
      title={label}
    >
      <span className="mr-1">{icon}</span>
      {size === 'md' && label}
    </button>
  );
}