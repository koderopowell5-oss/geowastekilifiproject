import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  console.log('ToastContainer rendering with toasts:', toasts);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastProps {
  toast: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  };
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  console.log('Toast component rendering:', toast);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 300);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bgColor: 'bg-[#56C596]/95',
          borderColor: 'border-[#329D9C]/30',
          icon: <CheckCircle size={18} className="text-white flex-shrink-0" />,
        };
      case 'error':
        return {
          bgColor: 'bg-red-500/95',
          borderColor: 'border-red-400/30',
          icon: <AlertCircle size={18} className="text-white flex-shrink-0" />,
        };
      case 'info':
        return {
          bgColor: 'bg-[#329D9C]/95',
          borderColor: 'border-[#329D9C]/30',
          icon: <Info size={18} className="text-white flex-shrink-0" />,
        };
      default:
        return {
          bgColor: 'bg-gray-500/95',
          borderColor: 'border-gray-400/30',
          icon: <Info size={18} className="text-white flex-shrink-0" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`pointer-events-auto ${styles.bgColor} border ${styles.borderColor} rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm flex items-center gap-3 min-w-[280px] max-w-[400px] transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
      }`}
    >
      {styles.icon}
      <p className="text-white text-[13px] font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="text-white/70 hover:text-white transition-colors flex-shrink-0 ml-2"
      >
        <X size={16} />
      </button>
    </div>
  );
};
