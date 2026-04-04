import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessCardProps {
  title: string;
  message: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({
  title,
  message,
  onClose,
  showCloseButton = true,
  className = '',
}) => {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl bg-[#56C596]/10 border border-[#56C596]/30 ${className}`}>
      <CheckCircle size={20} className="text-[#56C596] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[#56C596] text-[13px] mb-1">{title}</h3>
        <p className="text-[#205072] text-[12px] leading-relaxed">{message}</p>
      </div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="text-[#56C596]/50 hover:text-[#56C596] transition-colors flex-shrink-0 ml-2"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
