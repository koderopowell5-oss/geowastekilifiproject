/**
 * NOTIFICATION SYSTEM USAGE EXAMPLES
 * 
 * This file demonstrates how to use the toast notifications, success cards, and fail cards
 * throughout your application.
 */

import { useNotification } from '../context/NotificationContext';

/**
 * EXAMPLE 1: Using Toast Notifications (appears as floating box in top-right)
 */
export const ToastNotificationExample = () => {
  const { showSuccess, showError, showInfo } = useNotification();

  return (
    <div className="space-y-2">
      <button
        onClick={() => showSuccess('Data saved successfully!')}
        className="px-4 py-2 bg-[#56C596] text-white rounded-lg"
      >
        Show Success Toast
      </button>
      <button
        onClick={() => showError('Something went wrong!')}
        className="px-4 py-2 bg-red-500 text-white rounded-lg"
      >
        Show Error Toast
      </button>
      <button
        onClick={() => showInfo('This is an info message')}
        className="px-4 py-2 bg-[#329D9C] text-white rounded-lg"
      >
        Show Info Toast
      </button>
    </div>
  );
};

/**
 * EXAMPLE 2: Using Success Cards (displayed inline on page)
 * 
 * Usage in your component:
 * import { SuccessCard } from './SuccessCard';
 * 
 * const MyComponent = () => {
 *   const [showSuccess, setShowSuccess] = useState(false);
 *   
 *   return (
 *     <div>
 *       {showSuccess && (
 *         <SuccessCard
 *           title="Success!"
 *           message="Your form has been submitted successfully."
 *           onClose={() => setShowSuccess(false)}
 *         />
 *       )}
 *     </div>
 *   );
 * };
 */

/**
 * EXAMPLE 3: Using Fail Cards (displayed inline on page)
 * 
 * Usage in your component:
 * import { FailCard } from './FailCard';
 * 
 * const MyComponent = () => {
 *   const [error, setError] = useState<string | null>(null);
 *   
 *   return (
 *     <div>
 *       {error && (
 *         <FailCard
 *           title="Error"
 *           message={error}
 *           onClose={() => setError(null)}
 *         />
 *       )}
 *     </div>
 *   );
 * };
 */

/**
 * QUICK REFERENCE
 * 
 * TOASTS (Top-right floating notifications, auto-dismiss):
 * - showSuccess(message, duration?)  // Green, 4000ms default
 * - showError(message, duration?)    // Red, 4000ms default
 * - showInfo(message, duration?)     // Teal, 4000ms default
 * 
 * SUCCESS CARD (Inline, must manually close):
 * <SuccessCard
 *   title="Success title"
 *   message="Success message"
 *   onClose={handleClose}
 *   showCloseButton={true}  // optional, default true
 *   className=""            // optional, for additional styles
 * />
 * 
 * FAIL CARD (Inline, must manually close):
 * <FailCard
 *   title="Error title"
 *   message="Error message"
 *   onClose={handleClose}
 *   showCloseButton={true}  // optional, default true
 *   className=""            // optional, for additional styles
 * />
 */

/**
 * REAL WORLD EXAMPLE: Form Submission
 */
export const FormSubmissionExample = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess('Form submitted successfully!');
    } catch (error) {
      showError('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <button type="submit" disabled={loading}>
        Submit
      </button>
    </form>
  );
};

// NOTE: This file is for documentation. You don't need to import this anywhere.
// Just reference it when implementing notifications in your components.

import { useState } from 'react';
