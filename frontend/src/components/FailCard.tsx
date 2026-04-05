import React from 'react';
import { Send, X } from 'lucide-react';

interface FailCardProps {
  title: string;
  message: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export const FailCard: React.FC<FailCardProps> = ({
  title,
  message,
  onClose,
  showCloseButton = true,
  className = '',
}) => {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl bg-red-50/80 border border-red-200/50 ${className}`}>
      <Send size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-red-600 text-[13px] mb-1">{title}</h3>
        <p className="text-red-500/80 text-[12px] leading-relaxed">{message}</p>
      </div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="text-red-400/50 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
