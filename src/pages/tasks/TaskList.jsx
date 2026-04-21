import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { CheckSquare } from 'lucide-react';

const TaskList = () => {
  // Mock tasks for demonstration
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Implement Login API', status: 'COMPLETED', priority: 'High' },
    { id: 2, title: 'Design Database Schema', status: 'IN_PROGRESS', priority: 'High' },
    { id: 3, title: 'Review PRs', status: 'PENDING', priority: 'Medium' }
  ]);

  return (
    <div>
      <h1 className="text-section-heading" style={{ marginBottom: '32px' }}>My Tasks</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tasks.map(task => (
          <Card key={task.id} padding="16px" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                style={{ 
                  color: task.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-muted-text)',
                  cursor: 'pointer'
                }}
              >
                <CheckSquare size={24} />
              </div>
              <span className="text-body-large" style={{ 
                textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none',
                color: task.status === 'COMPLETED' ? 'var(--color-secondary-text)' : 'var(--color-primary-text)'
              }}>
                {task.title}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <Badge type={task.priority === 'High' ? 'warning' : 'default'}>{task.priority}</Badge>
              <Badge type={task.status === 'COMPLETED' ? 'success' : 'default'}>{task.status.replace('_', ' ')}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaskList;
