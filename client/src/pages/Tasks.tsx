import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/client';
import { Card, StatusPill, EmptyState, LoadingSpinner } from '../components/ui';
import { CheckCircleIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string;
  encounterId: string;
  patientName: string;
}

export default function Tasks() {
  const { t } = useTranslation();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get<Task[]>('/api/tasks'),
  });

  if (isLoading) {
    return <LoadingSpinner text={t('common.loading')} className="py-12" />;
  }

  const mapPriorityToDesignSystem = (priority: string): 'waiting' | 'in_progress' | 'ready' | 'delayed' => {
    switch (priority) {
      case 'high':
        return 'delayed';
      case 'medium':
        return 'waiting';
      case 'low':
        return 'ready';
      default:
        return 'waiting';
    }
  };

  const mapStatusToDesignSystem = (status: string): 'waiting' | 'in_progress' | 'ready' | 'delayed' => {
    switch (status) {
      case 'todo':
        return 'waiting';
      case 'in_progress':
        return 'in_progress';
      case 'done':
        return 'ready';
      default:
        return 'waiting';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-text-primary">{t('tasks.title')}</h1>
      </div>

      {tasks && tasks.length > 0 ? (
        <Card padding="none">
          <ul className="divide-y divide-border-default">
            {tasks.map((task) => (
              <li key={task.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-text-primary">
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill
                        status={mapPriorityToDesignSystem(task.priority)}
                        label={t(`tasks.priorities.${task.priority}`)}
                      />
                      <StatusPill
                        status={mapStatusToDesignSystem(task.status)}
                        label={t(`tasks.statuses.${task.status}`)}
                      />
                    </div>
                  </div>
                  {task.description && (
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary">{task.description}</p>
                    </div>
                  )}
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4" />
                      <span>{task.patientName}</span>
                    </div>
                    {task.assignedTo && (
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4" />
                        <span>{task.assignedTo}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState
          icon={<CheckCircleIcon className="w-12 h-12" />}
          title={t('tasks.empty.title')}
          description={t('tasks.empty.description')}
        />
      )}
    </div>
  );
}
