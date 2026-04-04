# Toast Notifications Quick Start

Your notification system is ready to use! Here's how to integrate it into your components.

## Import the Hook

```tsx
import { useNotification } from '../context/NotificationContext';
```

## Use in Your Component

```tsx
const MyComponent = () => {
  const { showSuccess, showError, showInfo } = useNotification();

  const handleAction = async () => {
    try {
      // Do something
      showSuccess('Success message here!');
    } catch (error: any) {
      showError(error.message || 'Something went wrong');
    }
  };

  return <button onClick={handleAction}>Take Action</button>;
};
```

## Quick Reference

### Toast Notifications (auto-dismiss in top-right)
```tsx
showSuccess('Saved successfully!');           // Green, 4s
showError('Failed to save');                  // Red, 4s
showInfo('Please note this info');            // Teal, 4s

// Custom duration (ms)
showSuccess('Message', 3000);
```

### Success Card (inline on page)
```tsx
import { SuccessCard } from '../components/SuccessCard';

<SuccessCard
  title="Success!"
  message="Your action completed."
  onClose={() => setShowSuccess(false)}
/>
```

### Fail Card (inline on page)
```tsx
import { FailCard } from '../components/FailCard';

<FailCard
  title="Error"
  message="Something went wrong."
  onClose={() => setError(null)}
/>
```

## Real Example: Waste Survey Form

```tsx
import { useNotification } from '../context/NotificationContext';

const WasteSurveyForm = () => {
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const response = await wasteApiService.submitSurvey(formData);
      showSuccess('Waste record saved successfully!');
      // Reset form or navigate
    } catch (error: any) {
      showError(error.message || 'Failed to save waste record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(formData); }}>
      {/* Form fields */}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Submit'}
      </button>
    </form>
  );
};
```

## Real Example: Login Form with Error Display

```tsx
import { FailCard } from '../components/FailCard';

const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    setSubmitting(true);
    
    try {
      await login(email, password);
      // Navigate to dashboard
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {error && (
        <FailCard
          title="Login Failed"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {/* Form fields */}
    </div>
  );
};
```

## Components to Update (Optional)

Here are some components that would benefit from adding notifications:

- **WasteSurveyForm.tsx** - Use `showSuccess()` on submit
- **LoginPage.tsx** - Use `FailCard` for errors
- **SignupPage.tsx** - Use `showSuccess()` on account creation
- **AdminDashboard.tsx** - Use for admin actions
- **EnumeratorDashboard.tsx** - Use for data operations
- **ProfileTab.tsx** - Use for profile updates

---

See **NOTIFICATIONS_GUIDE.md** for the complete documentation!
