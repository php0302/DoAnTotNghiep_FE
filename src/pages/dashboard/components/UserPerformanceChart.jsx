import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UserPerformanceChart = ({ data }) => {
  // data format: [{ username, fullName, completedTasks, totalAssigned }]
  
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-warm-muted dark:text-gray-500 italic bg-warm-white dark:bg-slate-800/50 rounded-xl border border-black/5 dark:border-white/5">
        Chưa có dữ liệu hiệu suất
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map(item => ({
    name: item.fullName || item.username,
    'Hoàn thành': item.completedTasks,
    'Được giao': item.totalAssigned,
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-black/5 dark:border-white/5 p-5 shadow-sm dark:shadow-none h-[350px] flex flex-col">
      <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Hiệu suất thành viên (Top 10)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="Được giao" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="Hoàn thành" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UserPerformanceChart;
