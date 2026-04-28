import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useTranslation } from '../context/I18nContext';
import { Send, Trash2, Loader } from 'lucide-react';

interface Comment {
  id: number;
  waste_site_id: number;
  author_id: number;
  author_name?: string;
  content: string;
  comment_type: 'general' | 'feedback' | 'flag' | 'correction';
  created_at: string;
}

interface CommentsPanelProps {
  recordId: number;
  userRole?: string;
  userId?: number;
}

export function CommentsPanel({ recordId, userRole, userId }: CommentsPanelProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'general' | 'feedback' | 'flag' | 'correction'>('general');
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'https://geowastekilifiproject.onrender.com/api';

  useEffect(() => {
    loadComments();
  }, [recordId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/records/${recordId}/comments`);
      const result = await response.json();

      if (result.success) {
        setComments(result.data);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      showNotification('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      showNotification('Comment cannot be empty', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${apiUrl}/records/${recordId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment,
          comment_type: commentType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setComments([result.data, ...comments]);
        setNewComment('');
        setCommentType('general');
        showNotification(t('commentAdded'), 'success');
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      showNotification('Failed to add comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${apiUrl}/records/${recordId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setComments(comments.filter(c => c.id !== commentId));
        showNotification('Comment deleted', 'success');
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showNotification('Failed to delete comment', 'error');
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'flag':
        return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'feedback':
        return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
      case 'correction':
        return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      default:
        return 'bg-gray-100 text-gray-800 border-l-4 border-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('commentsTitle')}</h3>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('commentType')}
            </label>
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="general">{t('general')}</option>
              <option value="feedback">{t('feedback')}</option>
              <option value="flag">{t('flag')}</option>
              <option value="correction">{t('correction')}</option>
            </select>
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('writeComment')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t('submit')}
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={`p-4 rounded-lg ${getCommentTypeColor(comment.comment_type)}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-sm">{comment.author_name || 'Anonymous'}</p>
                  <p className="text-xs opacity-70">
                    {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-xs font-medium mt-1 uppercase">
                    [{comment.comment_type}]
                  </p>
                </div>

                {(userId === comment.author_id || userRole === 'admin') && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
