import React from 'react';

const StatCard = ({ title, value, icon: Icon, gradientClass }) => {
  return (
    <div
      className={`rounded-xl p-6 shadow-md hover:shadow-lg transition-transform duration-300 hover:-translate-y-1 ${gradientClass} text-white`}
    >
      <div className="flex justify-between items-start">

        {/* Left Side */}
        <div>
          <p className="text-white/80 text-sm font-medium mb-1 uppercase tracking-wider">
            {title}
          </p>

          <h3 className="text-3xl font-bold">
            {value}
          </h3>
        </div>

        {/* Right Side Icon */}
        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">

          {Icon && (
            <Icon className="w-6 h-6 text-white" />
          )}

        </div>

      </div>
    </div>
  );
};

export default StatCard;