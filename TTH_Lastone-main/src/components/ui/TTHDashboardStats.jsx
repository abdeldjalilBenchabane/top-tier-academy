import React from 'react';

const DashboardStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-card rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
              {stat.change && (
                <p className={`text-sm ${
                  stat.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </p>
              )}
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <div className={`w-6 h-6 ${stat.iconColor}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;