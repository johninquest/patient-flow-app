import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/client';
import { useParams, Link } from 'react-router-dom';
import { Card, StatusPill, LoadingSpinner } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Encounter {
  id: string;
  patientId: string;
  patientName: string;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
  scheduledTime?: string;
  assignedTo?: string;
  notes?: string;
}

export default function EncounterDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { data: encounter, isLoading } = useQuery({
    queryKey: ['encounter', id],
    queryFn: () => api.get<Encounter>(`/api/encounters/${id}`),
  });

  if (isLoading) {
    return <LoadingSpinner text={t('common.loading')} className="py-12" />;
  }

  if (!encounter) {
    return <div className="text-center py-12 text-text-secondary">{t('encounters.notFound')}</div>;
  }

  const mapStatusToDesignSystem = (status: string): 'waiting' | 'in_progress' | 'ready' | 'delayed' => {
    switch (status) {
      case 'scheduled':
      case 'checked_in':
        return 'waiting';
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'ready';
      case 'cancelled':
        return 'delayed';
      default:
        return 'waiting';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/encounters" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80">
          <ArrowLeftIcon className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </Link>
      </div>

      <Card padding="none">
        <div className="px-4 py-5 sm:px-6 border-b border-border-default">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-text-primary">
              {encounter.patientName}
            </h3>
            <StatusPill
              status={mapStatusToDesignSystem(encounter.status)}
              label={t(`encounters.statuses.${encounter.status}`)}
            />
          </div>
        </div>
        <div>
          <dl>
            {encounter.scheduledTime && (
              <div className="bg-bg-canvas px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-text-secondary">{t('encounters.scheduledTime')}</dt>
                <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">
                  {new Date(encounter.scheduledTime).toLocaleString()}
                </dd>
              </div>
            )}
            {encounter.assignedTo && (
              <div className="bg-bg-surface px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-text-secondary">{t('encounters.assignedTo')}</dt>
                <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">{encounter.assignedTo}</dd>
              </div>
            )}
            {encounter.notes && (
              <div className="bg-bg-canvas px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-text-secondary">{t('encounters.notes')}</dt>
                <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">{encounter.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </Card>
    </div>
  );
}
