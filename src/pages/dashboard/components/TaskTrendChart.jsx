import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TaskTrendChart = ({ tasks }) => {
  // Generate last 7 days list
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      dateStr: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })
    };
  }).reverse();

  const chartData = last7Days.map(({ dateStr, label }) => {
    const count = (tasks || []).filter(task => {
      if (!task.createdAt) return false;
      const taskDate = task.createdAt.split('T')[0];
      return taskDate === dateStr;
    }).length;
    return {
      name: label,
      'Task mới': count,
    };
  });

  const hasData = chartData.some(item => item['Task mới'] > 0);

  if (!hasData) {
    return (
      <div className="h-[350px] flex items-center justify-center text-warm-muted dark:text-gray-500 italic bg-warm-white dark:bg-slate-800/50 rounded-xl border border-black/5 dark:border-white/5">
        Không có task nào được tạo trong 7 ngày gần đây
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-black/5 dark:border-white/5 p-5 shadow-sm dark:shadow-none h-[350px] flex flex-col">
      <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Xu hướng tạo Task (7 ngày qua)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/50" />
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
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="Task mới" 
              stroke="#6366f1" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorTasks)" 
              animationBegin={0}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TaskTrendChart;
