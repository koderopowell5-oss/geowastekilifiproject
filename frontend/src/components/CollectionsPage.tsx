import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { wasteApiService } from '../services/wasteApi';
import { useNotification } from '../context/NotificationContext';
import { WasteSiteRecord } from '../../../types';

interface DraftForm {
  id: string;
  formData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'submitted';
  ward: string;
  coordinatesPassed?: boolean;
}

interface CollectionsPageProps {
  onEditDraft?: (draftId: string, formData: Record<string, any>) => void;
  onStartNew?: () => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({ onEditDraft, onStartNew }) => {
  const [drafts, setDrafts] = useState<DraftForm[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess, showInfo } = useNotification();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'draft' | 'submitted' | 'all'>('draft');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { user } = useAuth();

  // Load drafts from localStorage on mount
  useEffect(() => {
    const loadDrafts = () => {
      try {
        setLoading(true);
        const userEmail = (user as any)?.email;
        if (!userEmail) {
          const errMsg = 'User email not found';
          setError(errMsg);
          showError(errMsg);
          setLoading(false);
          return;
        }

        const key = `geowaste_drafts_${userEmail}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDrafts(Array.isArray(parsed) ? parsed : []);
          showInfo(`Loaded ${parsed.length} draft(s)`);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading drafts:', err);
        const errMsg = 'Failed to load drafts';
        setError(errMsg);
        showError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    loadDrafts();
  }, [user]);

  const handleDeleteDraft = (id: string) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        const userEmail = (user as any)?.email;
        const key = `geowaste_drafts_${userEmail}`;
        const updated = drafts.filter((d) => d.id !== id);
        localStorage.setItem(key, JSON.stringify(updated));
        setDrafts(updated);
        showSuccess('Draft deleted ✓');
      } catch (err) {
        const errMsg = 'Failed to delete draft';
        setError(errMsg);
        showError(errMsg);
      }
    }
  };

  const handleSubmitDraft = async (draft: DraftForm) => {
    setSubmitting(draft.id);
    try {
      const userEmail = (user as any)?.email;
      // Submit the draft form via API with enumerator_email
      await wasteApiService.submitWasteSite({
        ...(draft.formData as Omit<WasteSiteRecord, 'id' | 'created_at' | 'updated_at'>),
        enumerator_email: userEmail || undefined,
      });

      // Mark as submitted in localStorage
      const updated = drafts.map((d) =>
        d.id === draft.id ? { ...d, status: 'submitted' as const } : d
      );
      const key = `geowaste_drafts_${userEmail}`;
      localStorage.setItem(key, JSON.stringify(updated));
      setDrafts(updated);

      showSuccess('Form submitted successfully! ✓');
    } catch (err: any) {
      const errMsg = err.message || 'Failed to submit form';
      setError(errMsg);
      showError(errMsg);
    } finally {
      setSubmitting(null);
    }
  };

  const filteredDrafts = drafts.filter((d) => {
    if (filter === 'draft') return d.status === 'draft';
    if (filter === 'submitted') return d.status === 'submitted';
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#CFF4D2] border-t-[#329D9C] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-[#205072]">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#205072] mb-1">My Collections</h2>
        <p className="text-sm text-gray-600">Manage your saved drafts and submitted forms</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 sm:gap-3 mb-8 flex-wrap">
        {(['draft', 'submitted', 'all'] as const).map((tab) => {
          const count = drafts.filter(d => {
            if (tab === 'draft') return d.status === 'draft';
            if (tab === 'submitted') return d.status === 'submitted';
            return true;
          }).length;
          
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab as 'draft' | 'submitted' | 'all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                filter === tab
                  ? 'bg-[#329D9C] text-white'
                  : 'bg-gray-100 text-[#205072] hover:bg-gray-200'
              }`}
            >
              <span className="capitalize">{tab}</span> ({count})
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-[#CFF4D2] border-t-[#329D9C] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-[#205072]">Loading collections...</p>
          </div>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-600 mb-4">
            {filter === 'draft'
              ? 'No draft surveys yet. Start a new survey to create your first draft.'
              : filter === 'submitted'
                ? 'No submitted surveys yet.'
                : 'No collections yet.'}
          </p>
          <button
            onClick={onStartNew}
            className="px-4 py-2 bg-[#329D9C] hover:bg-[#205072] text-white text-sm font-medium rounded-lg transition-all"
          >
            Start New Survey
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDrafts.map((draft) => (
            <div key={draft.id} className="border-b border-gray-200 py-4 last:border-b-0">
              {/* Survey Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      draft.status === 'draft'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {draft.status === 'draft' ? 'Draft' : 'Submitted'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#205072]">
                    Survey #{draft.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {draft.ward} • {new Date(draft.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {draft.status === 'draft' && (
                  <>
                    <button
                      onClick={() => onEditDraft?.(draft.id, draft.formData)}
                      className="px-3 py-1.5 text-xs sm:text-sm bg-[#329D9C] hover:bg-[#205072] text-white font-medium rounded transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleSubmitDraft(draft)}
                      disabled={submitting === draft.id}
                      className="px-3 py-1.5 text-xs sm:text-sm bg-[#56C596] hover:bg-[#329D9C] text-white font-medium rounded transition-all disabled:opacity-50"
                    >
                      {submitting === draft.id ? 'Submitting...' : 'Submit'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDeleteDraft(draft.id)}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
