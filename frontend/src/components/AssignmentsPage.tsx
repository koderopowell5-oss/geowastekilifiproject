import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useTranslation } from '../context/I18nContext';
import { Plus, Trash2, Edit2, Loader, ChevronDown } from 'lucide-react';
import { buildApiUrl, getFetchOptions } from '../config/api';

interface Assignment {
  id: number;
  enumerator_id: number;
  name?: string;
  email?: string;
  ward: string;
  target_records: number;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  assigned_at: string;
}

interface Enumerator {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function AssignmentsPage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enumerators, setEnumerators] = useState<Enumerator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    enumerator_id: '',
    ward: '',
    target_records: '',
    description: '',
    status: 'active',
  });

  const wards = [
    'Tezo', 'Mtepeni', 'Malindi', 'Mambrui', 'Ganda',
    'Takaungu', 'Rabai', 'Kayafungo', 'Kilifi', 'Mnarani',
  ];

  useEffect(() => {
    loadAssignments();
    loadEnumerators();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await fetch(buildApiUrl('/assignments'));
      const result = await response.json();

      if (result.success) {
        setAssignments(result.data);
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
      showNotification('Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEnumerators = async () => {
    try {
      const response = await fetch(buildApiUrl('/auth/enumerators'));
      const result = await response.json();

      if (result.success) {
        setEnumerators(result.data.filter((e: any) => e.role === 'enumerator'));
      }
    } catch (error) {
      console.error('Failed to load enumerators:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.enumerator_id || !formData.ward) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken');

      const method = editingId ? 'PATCH' : 'POST';
      const endpoint = editingId ? `/assignments/${editingId}` : '/assignments';

      const response = await fetch(buildApiUrl(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          enumerator_id: Number(formData.enumerator_id),
          ward: formData.ward,
          target_records: formData.target_records ? Number(formData.target_records) : null,
          description: formData.description || null,
          status: formData.status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (editingId) {
          setAssignments(assignments.map(a => a.id === editingId ? result.data : a));
          showNotification('Assignment updated successfully', 'success');
          setEditingId(null);
        } else {
          setAssignments([result.data, ...assignments]);
          showNotification('Assignment created successfully', 'success');
        }

        resetForm();
        setShowForm(false);
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Failed to save assignment:', error);
      showNotification('Failed to save assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this assignment?')) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(buildApiUrl(`/assignments/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setAssignments(assignments.filter(a => a.id !== id));
        showNotification('Assignment deleted', 'success');
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      showNotification('Failed to delete assignment', 'error');
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setFormData({
      enumerator_id: String(assignment.enumerator_id),
      ward: assignment.ward,
      target_records: String(assignment.target_records || ''),
      description: assignment.description || '',
      status: assignment.status,
    });
    setEditingId(assignment.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      enumerator_id: '',
      ward: '',
      target_records: '',
      description: '',
      status: 'active',
    });
    setEditingId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('assignmentsTitle')}</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          {t('createAssignment')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Assignment' : t('createAssignment')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('enumerator')} *
                </label>
                <select
                  value={formData.enumerator_id}
                  onChange={(e) => setFormData({ ...formData, enumerator_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select enumerator</option>
                  {enumerators.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('ward')} *
                </label>
                <select
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('targetRecords')}
                </label>
                <input
                  type="number"
                  value={formData.target_records}
                  onChange={(e) => setFormData({ ...formData, target_records: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('status')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">{t('active')}</option>
                  <option value="paused">{t('paused')}</option>
                  <option value="completed">{t('completed')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition"
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Update' : t('createAssignment')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No assignments yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t('enumerator')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('ward')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('targetRecords')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('status')}</th>
                <th className="px-4 py-3 text-left font-semibold">Assigned</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{assignment.name}</p>
                      <p className="text-xs text-gray-500">{assignment.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{assignment.ward}</td>
                  <td className="px-4 py-3">{assignment.target_records || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {t(assignment.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(assignment.assigned_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(assignment)}
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
