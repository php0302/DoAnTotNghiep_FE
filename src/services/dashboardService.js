import apiClient from './apiClient';

export const dashboardService = {
  getOverview: (projectId = '') => 
    apiClient.get('/dashboard/overview', { params: { projectId: projectId || undefined } }),
    
  getTaskStatusDistribution: (projectId = '') => 
    apiClient.get('/dashboard/tasks/status', { params: { projectId: projectId || undefined } }),
    
  getUserPerformance: (projectId = '') => 
    apiClient.get('/dashboard/users/performance', { params: { projectId: projectId || undefined } }),
};
