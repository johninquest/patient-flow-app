import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/client';
import { useParams, Link } from 'react-router-dom';

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
    return <div className="text-center py-12">{t('common.loading')}</div>;
  }

  if (!encounter) {
    return <div className="text-center py-12">Encounter not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'checked_in':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link to="/encounters" className="text-sm text-primary-600 hover:text-primary-500">
          ← {t('common.back')}
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {encounter.patientName}
            </h3>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(encounter.status)}`}>
              {t(`encounters.statuses.${encounter.status}`)}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {encounter.scheduledTime && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">{t('encounters.scheduledTime')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(encounter.scheduledTime).toLocaleString()}
                </dd>
              </div>
            )}
            {encounter.assignedTo && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">{t('encounters.assignedTo')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{encounter.assignedTo}</dd>
              </div>
            )}
            {encounter.notes && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">{t('encounters.notes')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{encounter.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
