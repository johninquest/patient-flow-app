import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/client';
import { useParams, Link } from 'react-router-dom';
import { Card, LoadingSpinner } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  notes?: string;
}

export default function PatientDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get<Patient>(`/api/patients/${id}`),
  });

  if (isLoading) {
    return <LoadingSpinner text={t('common.loading')} className="py-12" />;
  }

  if (!patient) {
    return <div className="text-center py-12 text-text-secondary">{t('patients.notFound')}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/patients" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80">
          <ArrowLeftIcon className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </Link>
      </div>

      <Card padding="none">
        <div className="px-4 py-5 sm:px-6 border-b border-border-default">
          <h3 className="text-lg font-medium text-text-primary">
            {patient.first_name} {patient.last_name}
          </h3>
        </div>
        <div>
          <dl>
            {patient.email && (
              <div className="bg-bg-canvas px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-text-secondary">{t('patients.email')}</dt>
                <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">{patient.email}</dd>
              </div>
            )}
            {patient.phone && (
              <div className="bg-bg-surface px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-text-secondary">{t('patients.phone')}</dt>
                <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">{patient.phone}</dd>
              </div>
            )}
            {patient.date_of_birth && (
              <div className="bg-bg-canvas px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-text-secondary">{t('patients.dateOfBirth')}</dt>
                <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">
                  {new Date(patient.date_of_birth).toLocaleDateString()}
                </dd>
              </div>
            )}
            {patient.address && (
              <div className="bg-bg-surface px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-text-secondary">{t('patients.address')}</dt>
                <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">{patient.address}</dd>
              </div>
            )}
            {patient.notes && (
              <div className="bg-bg-canvas px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-text-secondary">{t('patients.notes')}</dt>
                <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">{patient.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </Card>
    </div>
  );
}
