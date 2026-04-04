import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { SuccessCard } from './SuccessCard';
import { FailCard } from './FailCard';

/**
 * NOTIFICATION SYSTEM SHOWCASE
 * 
 * This component demonstrates all notification types.
 * Remove this file after reviewing or use it as a reference.
 */

export const NotificationShowcase: React.FC = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [showFailCard, setShowFailCard] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0faf5] p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#205072] mb-2">
            GeoWaste Notification System
          </h1>
          <p className="text-[#329D9C]">Click buttons to see notifications</p>
        </div>

        {/* Toast Notifications Section */}
        <div className="bg-white rounded-2xl border border-[#CFF4D2]/60 p-6">
          <h2 className="text-xl font-bold text-[#205072] mb-4">
            Toast Notifications
          </h2>
          <p className="text-[12px] text-gray-500 mb-4">
            Auto-dismiss floating notifications in the top-right corner
          </p>
          
          <div className="space-y-2">
            <button
              onClick={() => showSuccess('Data saved successfully!')}
              className="w-full px-4 py-3 bg-[#56C596] hover:bg-[#329D9C] text-white font-semibold rounded-lg transition"
            >
              Show Success Toast
            </button>
            <button
              onClick={() => showError('Something went wrong!')}
              className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
            >
              Show Error Toast
            </button>
            <button
              onClick={() => showInfo('This is an important notification')}
              className="w-full px-4 py-3 bg-[#329D9C] hover:bg-[#1f7b7a] text-white font-semibold rounded-lg transition"
            >
              Show Info Toast
            </button>
          </div>

          {/* Styling Info */}
          <div className="mt-6 p-4 bg-[#f0faf5] rounded-lg text-[12px] space-y-2">
            <div>
              <span className="font-semibold text-[#56C596]">Success:</span>
              <span className="text-gray-600"> Green background, 4s duration</span>
            </div>
            <div>
              <span className="font-semibold text-red-500">Error:</span>
              <span className="text-gray-600"> Red background, 4s duration</span>
            </div>
            <div>
              <span className="font-semibold text-[#329D9C]">Info:</span>
              <span className="text-gray-600"> Teal background, 4s duration</span>
            </div>
          </div>
        </div>

        {/* Success Card Section */}
        <div className="bg-white rounded-2xl border border-[#CFF4D2]/60 p-6">
          <h2 className="text-xl font-bold text-[#205072] mb-4">
            Success Card
          </h2>
          <p className="text-[12px] text-gray-500 mb-4">
            Inline success messages displayed on the page
          </p>

          {showSuccessCard && (
            <div className="mb-4">
              <SuccessCard
                title="Operation Successful"
                message="Your file has been uploaded successfully. You can now view it in your collection."
                onClose={() => setShowSuccessCard(false)}
              />
            </div>
          )}

          <button
            onClick={() => setShowSuccessCard(!showSuccessCard)}
            className="px-4 py-3 bg-[#56C596] hover:bg-[#329D9C] text-white font-semibold rounded-lg transition"
          >
            {showSuccessCard ? 'Hide' : 'Show'} Success Card
          </button>

          {/* Styling Info */}
          <div className="mt-6 p-4 bg-[#f0faf5] rounded-lg text-[12px] space-y-2">
            <div>
              <span className="font-semibold text-[#56C596]">Color:</span>
              <span className="text-gray-600"> Green (#56C596)</span>
            </div>
            <div>
              <span className="font-semibold text-[#56C596]">Icon:</span>
              <span className="text-gray-600"> CheckCircle</span>
            </div>
            <div>
              <span className="font-semibold text-[#56C596]">Close:</span>
              <span className="text-gray-600"> Manual with X button</span>
            </div>
          </div>
        </div>

        {/* Fail Card Section */}
        <div className="bg-white rounded-2xl border border-[#CFF4D2]/60 p-6">
          <h2 className="text-xl font-bold text-[#205072] mb-4">
            Fail Card
          </h2>
          <p className="text-[12px] text-gray-500 mb-4">
            Inline error messages displayed on the page
          </p>

          {showFailCard && (
            <div className="mb-4">
              <FailCard
                title="Upload Failed"
                message="The file format is not supported. Please upload a CSV or Excel file."
                onClose={() => setShowFailCard(false)}
              />
            </div>
          )}

          <button
            onClick={() => setShowFailCard(!showFailCard)}
            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
          >
            {showFailCard ? 'Hide' : 'Show'} Fail Card
          </button>

          {/* Styling Info */}
          <div className="mt-6 p-4 bg-[#f0faf5] rounded-lg text-[12px] space-y-2">
            <div>
              <span className="font-semibold text-red-500">Color:</span>
              <span className="text-gray-600"> Red (#EF4444)</span>
            </div>
            <div>
              <span className="font-semibold text-red-500">Icon:</span>
              <span className="text-gray-600"> AlertCircle</span>
            </div>
            <div>
              <span className="font-semibold text-red-500">Close:</span>
              <span className="text-gray-600"> Manual with X button</span>
            </div>
          </div>
        </div>

        {/* Usage Guide */}
        <div className="bg-white rounded-2xl border border-[#CFF4D2]/60 p-6">
          <h2 className="text-xl font-bold text-[#205072] mb-4">Quick Usage</h2>
          
          <div className="space-y-4 text-[12px] font-mono bg-[#f0faf5] p-4 rounded-lg overflow-x-auto">
            <div>
              <span className="text-blue-600">import</span> {'{ useNotification }'} <span className="text-blue-600">from</span> <span className="text-green-600">'../context/NotificationContext'</span>
            </div>
            
            <div className="mt-4">
              <span className="text-blue-600">const</span> MyComponent = {'() => {'}</div>
              <div className="ml-4">
                <span className="text-blue-600">const</span> {'{showSuccess, showError}'} = <span className="text-purple-600">useNotification</span>()
              </div>
              
              <div className="ml-4 mt-2">
                <span className="text-blue-600">return</span> (
              </div>
              
              <div className="ml-8">
                {'<'}<span className="text-red-600">button</span> <span className="text-orange-600">onClick</span>={'{() => '}
                <span className="text-purple-600">showSuccess</span>(<span className="text-green-600">'Success!'</span>)
                {'}'}{'>'}
                <br />
                  Save
                <br />
                {'</'}<span className="text-red-600">button</span>{'>'}
              </div>
              
              <div className="ml-4">
                {')'}
              </div>
              
              <div>{'}'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[12px] text-gray-500">
          <p>See NOTIFICATIONS_GUIDE.md for complete documentation</p>
        </div>
      </div>
  );
};
