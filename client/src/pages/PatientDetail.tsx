import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/client';
import { useParams, Link } from 'react-router-dom';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
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
    return <div className="text-center py-12">{t('common.loading')}</div>;
  }

  if (!patient) {
    return <div className="text-center py-12">Patient not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link to="/patients" className="text-sm text-primary-600 hover:text-primary-500">
          ← {t('common.back')}
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {patient.firstName} {patient.lastName}
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {patient.email && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">{t('patients.email')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.email}</dd>
              </div>
            )}
            {patient.phone && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">{t('patients.phone')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.phone}</dd>
              </div>
            )}
            {patient.dateOfBirth && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">{t('patients.dateOfBirth')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </dd>
              </div>
            )}
            {patient.address && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">{t('patients.address')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.address}</dd>
              </div>
            )}
            {patient.notes && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">{t('patients.notes')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
