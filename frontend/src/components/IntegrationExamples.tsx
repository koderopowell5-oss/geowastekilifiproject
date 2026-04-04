// INTEGRATION EXAMPLES FOR GEOWASTE KILIFI NOTIFICATION SYSTEM
// ================================================================
// 
// This file shows example patterns for using the notification system.
// Copy and paste the code snippets below into your own components.
//
// IMPORT REQUIRED MODULES:
// import { useNotification } from '../context/NotificationContext';
// import { SuccessCard } from './SuccessCard';
// import { FailCard } from './FailCard';
//
// ================================================================
// EXAMPLE 1: Basic Form Submission with Success/Error Toast
// ================================================================
//
// const MyForm = () => {
//   const { showSuccess, showError } = useNotification();
//   const [loading, setLoading] = useState(false);
//
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await submitForm(data);
//       showSuccess('Form submitted successfully!');
//     } catch (error: any) {
//       showError(error.message || 'Failed to submit');
//     } finally {
//       setLoading(false);
//     }
//   };
// };
//
// ================================================================
// EXAMPLE 2: Login with Inline Error Card
// ================================================================
//
// const LoginPage = () => {
//   const { showInfo } = useNotification();
//   const [error, setError] = useState<string | null>(null);
//
//   const handleLogin = async () => {
//     try {
//       await login(email, password);
//       showInfo('Welcome back!');
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };
//
//   return (
//     <>
//       {error && <FailCard title="Error" message={error} onClose={() => setError(null)} />}
//       {/* form fields */}
//     </>
//   );
// };
//
// ================================================================
// EXAMPLE 3: Delete with Confirmation
// ================================================================
//
// const handleDelete = async (id: string) => {
//   if (!window.confirm('Are you sure?')) return;
//
//   const { showSuccess, showError } = useNotification();
//   try {
//     await deleteRecord(id);
//     showSuccess('Record deleted successfully');
//   } catch (error: any) {
//     showError('Failed to delete');
//   }
// };
//
// ================================================================
// EXAMPLE 4: Success/Fail Cards for Inline Display
// ================================================================
//
// const DataImport = () => {
//   const [importResult, setImportResult] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);
//
//   return (
//     <div>
//       {importResult && (
//         <SuccessCard
//           title="Import Complete"
//           message={`${importResult.count} records imported`}
//           onClose={() => setImportResult(null)}
//         />
//       )}
//       {error && (
//         <FailCard
//           title="Import Failed"
//           message={error}
//           onClose={() => setError(null)}
//         />
//       )}
//     </div>
//   );
// };
//
// ================================================================
// EXAMPLE 5: Batch Operations with Progress
// ================================================================
//
// const processBatch = async (records: any[]) => {
//   const { showSuccess, showError, showInfo } = useNotification();
//
//   try {
//     for (let i = 0; i < records.length; i++) {
//       await processRecord(records[i]);
//       if ((i + 1) % 10 === 0) {
//         showInfo(`Processed ${i + 1} records`);
//       }
//     }
//     showSuccess(`All ${records.length} records processed`);
//   } catch (error: any) {
//     showError('Batch processing failed');
//   }
// };
//
// ================================================================
// NOTIFICATION METHODS AVAILABLE:
// ================================================================
//
// const { showSuccess, showError, showInfo } = useNotification();
//
// showSuccess(message, duration?)  -> Shows green toast (auto-dismiss)
// showError(message, duration?)    -> Shows red toast (auto-dismiss)
// showInfo(message, duration?)     -> Shows teal toast (auto-dismiss)
//
// Default duration: 4000ms (4 seconds)
// Duration 0: stays indefinitely
//
// SuccessCard and FailCard components display inline on the page
// and require manual close via onClose callback
//

export {};
