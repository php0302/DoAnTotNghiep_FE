import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import StatisticCard from './components/StatisticCard';
import TaskStatusChart from './components/TaskStatusChart';
import UserPerformanceChart from './components/UserPerformanceChart';
import TaskPriorityChart from './components/TaskPriorityChart';
import TaskTrendChart from './components/TaskTrendChart';
import Spinner from '../../components/ui/Spinner';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const StatisticDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [overview, setOverview] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [tasksList, setTasksList] = useState([]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

  if (user && ['MEMBER', 'ROLE_MEMBER'].includes(user.role)) {
    return <Navigate to="/projects" replace />;
  }

  // Fetch project list for dropdown
  useEffect(() => {
    projectService.getAll()
      .then(({ data }) => {
        setProjects(data?.data || []);
      })
      .catch(console.error);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [overviewRes, statusRes, perfRes, tasksRes] = await Promise.all([
          dashboardService.getOverview(selectedProjectId),
          dashboardService.getTaskStatusDistribution(selectedProjectId),
          dashboardService.getUserPerformance(selectedProjectId),
          taskService.search({ projectId: selectedProjectId || undefined, size: 1000 })
        ]);

        setOverview(overviewRes.data?.data);
        setStatusData(statusRes.data?.data);
        setPerformanceData(perfRes.data?.data);
        setTasksList(tasksRes.data?.data?.content || []);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedProjectId]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-warm-muted dark:text-gray-400 mt-1">
            {isAdmin ? 'Tổng quan toàn bộ hệ thống' : 'Tổng quan các dự án của bạn'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="input-field py-2 text-sm min-w-[200px]"
          >
            <option value="">Tất cả dự án</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Statistic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatisticCard
              title={selectedProjectId ? "Tổng Task" : "Tổng Dự Án"}
              value={selectedProjectId ? overview?.totalTasks : overview?.totalProjects}
              icon={FolderKanban}
              colorClass="bg-blue-100 text-blue-600"
            />
            <StatisticCard
              title="Task Hoàn Thành"
              value={statusData?.DONE || 0}
              icon={CheckCircle2}
              colorClass="bg-emerald-100 text-emerald-600"
            />
            <StatisticCard
              title="Task Đang Làm"
              value={statusData?.IN_PROGRESS || 0}
              icon={Clock}
              colorClass="bg-amber-100 text-amber-600"
            />
            <StatisticCard
              title="Task Quá Hạn"
              value={overview?.overdueTasks || 0}
              icon={AlertTriangle}
              colorClass="bg-red-100 text-red-600"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TaskStatusChart data={statusData} />
            </div>
            <div className="lg:col-span-2">
              <UserPerformanceChart data={performanceData} />
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TaskTrendChart tasks={tasksList} />
            </div>
            <div className="lg:col-span-1">
              <TaskPriorityChart tasks={tasksList} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticDashboard;

