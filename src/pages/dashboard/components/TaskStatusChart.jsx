import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  TODO: '#94a3b8',        // slate-400
  IN_PROGRESS: '#3b82f6', // blue-500
  DONE: '#10b981',        // emerald-500
};

const LABELS = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  DONE: 'Hoàn thành',
};

const TaskStatusChart = ({ data }) => {
  // data format: { TODO: 10, IN_PROGRESS: 5, DONE: 20 }
  const chartData = Object.entries(data || {}).map(([key, value]) => ({
    name: LABELS[key] || key,
    value: value,
    color: COLORS[key] || '#cbd5e1',
  })).filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-warm-muted italic bg-warm-white rounded-xl border border-black/5">
        Chưa có dữ liệu task
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-black/5 p-5 shadow-sm h-[350px] flex flex-col">
      <h3 className="text-base font-bold text-gray-800 mb-4">Phân bố trạng thái Task</h3>
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

export default TaskStatusChart;
