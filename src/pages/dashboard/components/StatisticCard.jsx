import React from 'react';

const StatisticCard = ({ title, value, icon: Icon, colorClass }) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-5 shadow-sm dark:shadow-none hover:shadow-md transition-shadow flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider mb-2">
          {title}
        </h3>
        <p className="text-3xl font-bold text-gray-800 dark:text-white">
          {value}
        </p>
      </div>
      <div className={`p-4 rounded-full ${colorClass}`}>
        <Icon size={24} className="opacity-90" />
      </div>
    </div>
  );
};

export default StatisticCard;
