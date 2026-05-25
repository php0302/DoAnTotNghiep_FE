import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  HIGH: '#f97316',   // orange-500
  MEDIUM: '#3b82f6', // blue-500
  LOW: '#64748b',    // slate-500
};

const LABELS = {
  HIGH: 'Ưu tiên Cao',
  MEDIUM: 'Ưu tiên Trung bình',
  LOW: 'Ưu tiên Thấp',
};

const TaskPriorityChart = ({ tasks }) => {
  // Group tasks by priority
  const priorityCounts = (tasks || []).reduce((acc, task) => {
    const priority = task.priority || 'MEDIUM';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, { LOW: 0, MEDIUM: 0, HIGH: 0 });

  const chartData = Object.entries(priorityCounts).map(([key, value]) => ({
    name: LABELS[key] || key,
    value: value,
    color: COLORS[key] || '#cbd5e1',
  })).filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-warm-muted dark:text-gray-500 italic bg-warm-white dark:bg-slate-800/50 rounded-xl border border-black/5 dark:border-white/5">
        Chưa có dữ liệu độ ưu tiên
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-black/5 dark:border-white/5 p-5 shadow-sm dark:shadow-none h-[350px] flex flex-col">
      <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Phân bố độ ưu tiên Task</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [value, 'Số lượng']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TaskPriorityChart;
