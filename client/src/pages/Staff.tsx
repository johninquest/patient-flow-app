import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api/client';
import { useAuth } from '../contexts/AuthContext';

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  title: string | null;
  status: string;
  createdAt: string;
}

const ROLES = ['admin', 'provider', 'clinical_staff', 'front_desk'] as const;

const TITLES = [
  'Doctor',
  'Nurse',
  'Medical Physicist',
  'Lab Technician',
  'Pharmacist',
  'Receptionist',
  'Administrator',
] as const;

export default function Staff() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState<string | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get<StaffMember[]>('/api/users'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; title?: string } }) =>
      api.patch<StaffMember>(`/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string; title?: string }) =>
      api.post<StaffMember>('/api/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowCreateModal(false);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<StaffMember>(`/api/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowSuspendConfirm(null);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateMutation.mutate({ id: userId, data: { role: newRole } });
  };

  const handleTitleChange = (userId: string, newTitle: string) => {
    updateMutation.mutate({ id: userId, data: { title: newTitle || undefined } });
  };

  const handleCreateStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const role = formData.get('role') as string;
    const title = formData.get('title') as string;

    if (password !== confirmPassword) {
      setError(t('staff.passwordMismatch'));
      return;
    }

    createMutation.mutate({
      name,
      email,
      password,
      role,
      title: title || undefined,
    });
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    if (newStatus === 'suspended') {
      setShowSuspendConfirm(userId);
    } else {
      statusMutation.mutate({ id: userId, status: newStatus });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('staff.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('staff.description')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {t('staff.createStaff')}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <form onSubmit={handleCreateStaff}>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('staff.createStaff')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('staff.name')}</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('staff.email')}</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('staff.password')}</label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('staff.confirmPassword')}</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      minLength={8}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('staff.role')}</label>
                    <select
                      name="role"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {t(`staff.roles.${role}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('staff.title_field')}</label>
                    <select
                      name="title"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="">{t('staff.noTitle')}</option>
                      {TITLES.map((title) => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? t('common.loading') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('staff.confirmSuspend')}</h2>
            <p className="text-sm text-gray-600 mb-6">{t('staff.suspendWarning')}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSuspendConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  statusMutation.mutate({ id: showSuspendConfirm, status: 'suspended' });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                {t('staff.suspend')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('staff.name')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('staff.email')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('staff.role')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('staff.title_field')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('staff.status')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('staff.joined')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff?.map((member) => {
              const isSelf = member.id === currentUser?.id;
              const isSuspended = member.status === 'suspended';
              return (
                <tr key={member.id} className={`${isSelf ? 'bg-blue-50' : ''} ${isSuspended ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className={`text-sm font-medium ${isSuspended ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {member.name || '—'}
                          {isSelf && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {t('staff.you')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={isSelf && member.role === 'admin'}
                      className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isSelf && member.role === 'admin' ? t('staff.cannotDemoteSelf') : undefined}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {t(`staff.roles.${role}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.title || ''}
                      onChange={(e) => handleTitleChange(member.id, e.target.value)}
                      disabled={isSuspended}
                      className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                    >
                      <option value="">{t('staff.noTitle')}</option>
                      {TITLES.map((title) => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isSuspended
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {isSuspended ? t('staff.suspended') : t('staff.active')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!isSelf && (
                      <button
                        onClick={() => handleStatusChange(member.id, isSuspended ? 'active' : 'suspended')}
                        disabled={statusMutation.isPending}
                        className={`px-3 py-1 text-xs font-medium rounded-md ${
                          isSuspended
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        } disabled:opacity-50`}
                      >
                        {isSuspended ? t('staff.activate') : t('staff.suspend')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
