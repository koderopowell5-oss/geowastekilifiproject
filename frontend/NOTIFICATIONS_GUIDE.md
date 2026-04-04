# Toast Notifications & Alert Cards - Documentation

## Overview

The GeoWaste Kilifi frontend now includes a comprehensive notification system with three key components:

1. **Toast Notifications** - Floating auto-dismiss notifications (top-right corner)
2. **Success Cards** - Inline success messages with icon and close button
3. **Fail Cards** - Inline error/failure messages with icon and close button

All components follow a minimal and simple design philosophy with consistent branding colors.

---

## Setup

The notification system is already integrated into your app. The `NotificationProvider` wraps your entire application in `App.tsx`, and the `ToastContainer` displays floating notifications.

### No additional setup needed!

---

## Components

### 1. Toast Notifications

**Location**: `components/Toast.tsx`

Floating notifications that automatically dismiss after a set duration.

#### Usage in Components:

```tsx
import { useNotification } from '../context/NotificationContext';

const MyComponent = () => {
  const { showSuccess, showError, showInfo } = useNotification();

  const handleSave = async () => {
    try {
      // Do something
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError('Failed to save. Please try again.');
    }
  };

  return <button onClick={handleSave}>Save</button>;
};
```

#### Available Methods:

```tsx
const { showSuccess, showError, showInfo } = useNotification();

// Success notification (green)
showSuccess('Operation completed!');
showSuccess('Operation completed!', 3000); // Custom duration in ms

// Error notification (red)
showError('Something went wrong!');
showError('Something went wrong!', 5000); // Custom duration

// Info notification (teal)
showInfo('Please note this information');
showInfo('Please note this information', 4000);
```

#### Features:
- ✅ Auto-dismiss (default 4000ms)
- ✅ Manual close button (X)
- ✅ Smooth animations (fade in/out)
- ✅ Stacked multiple notifications
- ✅ Styled with brand colors
- ✅ Icons: CheckCircle (success), AlertCircle (error), Info (info)

---

### 2. Success Card

**Location**: `components/SuccessCard.tsx`

Inline success message card displayed on the page.

#### Usage in Components:

```tsx
import { useState } from 'react';
import { SuccessCard } from '../components/SuccessCard';

const MyComponent = () => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    // Do something
    setShowSuccess(true);
  };

  return (
    <div>
      {showSuccess && (
        <SuccessCard
          title="Success!"
          message="Your form has been submitted successfully."
          onClose={() => setShowSuccess(false)}
        />
      )}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```

#### Props:

```tsx
interface SuccessCardProps {
  title: string;              // Bold title text
  message: string;            // Subtitle text
  onClose?: () => void;       // Callback when close button clicked
  showCloseButton?: boolean;  // Show/hide close button (default: true)
  className?: string;         // Additional Tailwind classes
}
```

#### Features:
- ✅ Green color scheme (#56C596)
- ✅ CheckCircle icon
- ✅ Close button (X)
- ✅ Rounded corners with subtle border
- ✅ Responsive sizing

---

### 3. Fail Card

**Location**: `components/FailCard.tsx`

Inline error/failure message card displayed on the page.

#### Usage in Components:

```tsx
import { useState } from 'react';
import { FailCard } from '../components/FailCard';

const MyComponent = () => {
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    try {
      // Do something
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      {error && (
        <FailCard
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      <button onClick={handleAction}>Perform Action</button>
    </div>
  );
};
```

#### Props:

```tsx
interface FailCardProps {
  title: string;              // Bold title text
  message: string;            // Subtitle text
  onClose?: () => void;       // Callback when close button clicked
  showCloseButton?: boolean;  // Show/hide close button (default: true)
  className?: string;         // Additional Tailwind classes
}
```

#### Features:
- ✅ Red color scheme (red-500/red-600)
- ✅ AlertCircle icon
- ✅ Close button (X)
- ✅ Rounded corners with subtle border
- ✅ Responsive sizing

---

## Real-World Examples

### Example 1: Form Submission with Toast

```tsx
import { useNotification } from '../context/NotificationContext';

const WasteForm = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate and submit
      const response = await submitWasteData(formData);
      showSuccess('Waste record saved successfully!');
      reset();
    } catch (error: any) {
      showError(error.message || 'Failed to save waste record.');
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Example 2: Inline Error Display

```tsx
import { FailCard } from '../components/FailCard';

const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
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

### Example 3: Combined Usage

```tsx
import { useNotification } from '../context/NotificationContext';
import { SuccessCard } from '../components/SuccessCard';

const DataImport = () => {
  const { showError } = useNotification();
  const [showSuccess, setShowSuccess] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleImport = async (file: File) => {
    setInlineError(null);

    try {
      const data = await parseFile(file);
      
      if (!data.isValid) {
        setInlineError('Invalid file format');
        return;
      }

      await importData(data);
      setShowSuccess(true);
      
      // Clear success card after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      showError('Import failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {inlineError && (
        <FailCard
          title="Import Error"
          message={inlineError}
          onClose={() => setInlineError(null)}
        />
      )}
      {showSuccess && (
        <SuccessCard
          title="Import Complete"
          message="Your data has been imported successfully."
          onClose={() => setShowSuccess(false)}
        />
      )}
      <input
        type="file"
        onChange={(e) => handleImport(e.target.files?.[0]!)}
      />
    </div>
  );
};
```

---

## Colors & Styling

### Color Scheme

| Component | Color | Hex Code |
|-----------|-------|----------|
| Success Toast | Green | #56C596 |
| Error Toast | Red | #EF4444 |
| Info Toast | Teal | #329D9C |
| Success Card | Green | #56C596 |
| Fail Card | Red | #EF4444 |

### Design Features

- **Minimal**: Clean, simple layouts with just essential information
- **Accessible**: Clear icons and colors, good contrast ratios
- **Responsive**: Works on mobile, tablet, and desktop
- **Smooth**: All animations use 300ms transitions
- **Dismissible**: Users can close messages manually
- **Non-intrusive**: Cards don't disrupt user flow

---

## Best Practices

1. **Use Toasts for temporary notifications** that don't need user action
   ```tsx
   showSuccess('Changes saved automatically');
   ```

2. **Use Cards for errors that need acknowledgment**
   ```tsx
   <FailCard title="Validation Error" message={errorMsg} />
   ```

3. **Keep messages concise** - Users should understand at a glance
   ```tsx
   ✅ showSuccess('Record saved');
   ❌ showSuccess('Your waste collection record has been successfully saved to the database');
   ```

4. **Use appropriate types** - Match message tone to notification type
   ```tsx
   ✅ showError('Failed to save');
   ❌ showInfo('Failed to save');
   ```

5. **Handle async operations** carefully
   ```tsx
   setLoading(true);
   try {
     const result = await apiCall();
     showSuccess('Success!');
   } catch (error) {
     showError('Failed');
   } finally {
     setLoading(false);
   }
   ```

---

## File Structure

```
src/
├── context/
│   └── NotificationContext.tsx    # Notification context & provider
├── components/
│   ├── Toast.tsx                  # Toast component & container
│   ├── SuccessCard.tsx            # Success card component
│   ├── FailCard.tsx               # Fail card component
│   ├── Notifications/
│   │   └── index.ts               # Barrel export
│   └── NotificationExamples.tsx   # Usage examples
└── App.tsx                        # Already integrated
```

---

## API Reference

### useNotification Hook

```tsx
const {
  toasts,           // Current array of toast objects
  addToast,         // Manual toast creation
  removeToast,      // Remove specific toast by ID
  showSuccess,      // Show success toast
  showError,        // Show error toast
  showInfo,         // Show info toast
} = useNotification();
```

### Toast Object

```tsx
interface Toast {
  id: string;                           // Unique identifier
  message: string;                      // Toast message
  type: 'success' | 'error' | 'info';   // Toast type
  duration?: number;                    // Auto-dismiss duration (ms)
}
```

---

## Troubleshooting

### Toast not appearing?
- Ensure `NotificationProvider` wraps your app in `App.tsx`
- Ensure `ToastContainer` is rendered in `App.tsx`
- Check browser console for errors

### Notifications not working in context?
- Verify you're using the hook inside a component wrapped by `NotificationProvider`
- The hook must be called inside a component, not at module level

### Styling doesn't match?
- Ensure Tailwind CSS is properly configured
- Check that the component files use the correct class names
- Verify no CSS is overriding the notification styles

---

## Future Enhancements

Possible improvements that could be added:
- Position customization (top-left, bottom-right, etc.)
- Progress bar for toast duration
- Sound notifications
- Custom icons
- Action buttons in toasts
- Notification history log

---

Enjoy your new notification system! 🎉
