/**
 * INTEGRATION EXAMPLES FOR GEOWASTE KILIFI COMPONENTS
 * 
 * Copy and paste these patterns into your existing components
 */

/*
// ============================================================================
// EXAMPLE 1: WasteSurveyForm.tsx Integration
// ============================================================================

import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

const WasteSurveyFormExample = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, formData: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.wasteType || !formData.location) {
        showError('Please fill in all required fields');
        return;
      }

      // Submit to API
      const response = await wasteApiService.submitSurvey(formData);

      // Success!
      showSuccess('Waste record saved successfully!');

      // Reset form or navigate
      // resetForm();
      // navigate('/records');
    } catch (error: any) {
      showError(error.message || 'Failed to save waste record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, formData)}>
      {/* Your existing form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Submit Record'}
      </button>
    </form>
  );
};
*/

/*
// ============================================================================
// EXAMPLE 2: LoginPage.tsx Integration with Error Card
// ============================================================================

import React, { useState } from 'react';
import { FailCard } from '../components/FailCard';
import { useNotification } from '../context/NotificationContext';

const LoginPageExample = () => {
  const { showInfo } = useNotification(); // Success uses toast
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      // Login successful
      showInfo('Welcome back!');

      // Navigate to dashboard or do something
      // navigate('/dashboard');
    } catch (err: any) {
      // Set error to display in FailCard
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Error card displayed at top of form */}
      {error && (
        <FailCard
          title="Login Failed"
          message={error}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
        />
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Password"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
*/

/*
// ============================================================================
// EXAMPLE 3: SignupPage.tsx Integration
// ============================================================================

import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

const SignupPageExample = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    ward: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (formData.password !== formData.confirmPassword) {
        showError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
      }

      // Submit signup
      await signup(
        formData.name,
        formData.email,
        formData.password,
        formData.ward,
        formData.phone
      );

      // Success!
      showSuccess('Account created successfully! You can now log in.');

      // Navigate to login
      // navigate('/login');
    } catch (error: any) {
      showError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
};
*/

/*
// ============================================================================
// EXAMPLE 4: ProfileTab.tsx Integration (Update Profile)
// ============================================================================

import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

const ProfileTabExample = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });

  const handleUpdateProfile = async () => {
    setLoading(true);

    try {
      // Validate
      if (!profileData.name || !profileData.email) {
        showError('Please fill in all required fields');
        return;
      }

      // Update profile
      await updateProfile(profileData);

      // Success!
      showSuccess('Profile updated successfully');

      // Optional: Refresh user data
    } catch (error: any) {
      showError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Profile form fields */}
      <button onClick={handleUpdateProfile} disabled={loading}>
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );
};
*/

/*
// ============================================================================
// EXAMPLE 5: Records Deletion with Confirmation
// ============================================================================

import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

const DeleteRecordExample = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleDeleteRecord = async (recordId: string) => {
    // Ask for confirmation first
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    setLoading(true);

    try {
      await deleteRecord(recordId);

      // Success!
      showSuccess('Record deleted successfully');

      // Refresh list or navigate
      // fetchRecords();
    } catch (error: any) {
      showError('Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={() => handleDeleteRecord('some-id')} disabled={loading}>
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  );
};
*/

/*
// ============================================================================
// EXAMPLE 6: Data Import with Error Handling
// ============================================================================

import React, { useState } from 'react';
import { SuccessCard } from '../components/SuccessCard';
import { FailCard } from '../components/FailCard';
import { useNotification } from '../context/NotificationContext';

const DataImportExample = () => {
  const { showError } = useNotification();
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileImport = async (file: File) => {
    setError(null);
    setImportResult(null);

    try {
      // Validate file
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        showError('Please upload a CSV or Excel file');
        return;
      }

      // Parse and import
      const result = await importWasteData(file);

      // Show success card with details
      setImportResult({
        recordsImported: result.count,
        fileName: file.name,
      });
    } catch (err: any) {
      setError(err.message || 'Import failed');
    }
  };

  return (
    <div className="space-y-4">
      {importResult && (
        <SuccessCard
          title="Import Successful"
          message={`${importResult.recordsImported} records imported from ${importResult.fileName}`}
          onClose={() => setImportResult(null)}
        />
      )}

      {error && (
        <FailCard
          title="Import Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <input type="file" onChange={(e) => handleFileImport(e.target.files![0])} />
    </div>
  );
};
*/

/*
// ============================================================================
// EXAMPLE 7: Batch Operations (Multiple Records)
// ============================================================================

import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

const BatchOperationExample = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProcessBatch = async (recordIds: string[]) => {
    setProcessing(true);
    setProgress(0);

    try {
      const total = recordIds.length;

      for (let i = 0; i < total; i++) {
        await processRecord(recordIds[i]);
        setProgress(((i + 1) / total) * 100);

        // Optional: Show progress info every 5 records
        if ((i + 1) % 5 === 0) {
          showInfo(`Processed ${i + 1} of ${total} records`);
        }
      }

      // All done!
      showSuccess(`Successfully processed ${total} records`);
    } catch (error: any) {
      showError('Batch processing failed. Some records may not have been processed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div>Progress: {progress.toFixed(0)}%</div>
      <button onClick={() => handleProcessBatch(['id1', 'id2', 'id3'])} disabled={processing}>
        {processing ? 'Processing...' : 'Process Records'}
      </button>
    </div>
  );
};
*/

// ============================================================================
// COPY-PASTE SNIPPETS FOR QUICK INTEGRATION
// ============================================================================

/*
// FOR FORM SUBMISSION:
// 
// const { showSuccess, showError } = useNotification();
// const [loading, setLoading] = useState(false);
//
// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setLoading(true);
//   try {
//     await submitForm(formData);
//     showSuccess('Form submitted successfully!');
//   } catch (error: any) {
//     showError(error.message);
//   } finally {
//     setLoading(false);
//   }
// };
*/

/*
// FOR INLINE ERROR DISPLAY:
// 
// const [error, setError] = useState<string | null>(null);
//
// return (
//   <>
//     {error && <FailCard title="Error" message={error} onClose={() => setError(null)} />}
//     {/* Your form here */}
//   </>
// );
*/

/*
// FOR DELETE CONFIRMATION:
// 
// const handleDelete = async (id: string) => {
//   if (!window.confirm('Are you sure?')) return;
//   try {
//     await deleteItem(id);
//     showSuccess('Item deleted');
//   } catch (error: any) {
//     showError(error.message);
//   }
// };
*/

export {};
