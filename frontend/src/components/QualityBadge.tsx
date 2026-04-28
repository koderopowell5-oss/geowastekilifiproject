import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface QualityBadgeProps {
  score: number;
  issues?: string[];
  isFlagged?: boolean;
}

export function QualityBadge({ score, issues, isFlagged }: QualityBadgeProps) {
  const getQualityInfo = (score: number) => {
    if (score >= 85) {
      return {
        level: 'Excellent',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        bgIcon: 'bg-green-50',
      };
    }
    if (score >= 70) {
      return {
        level: 'Good',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: CheckCircle,
        bgIcon: 'bg-blue-50',
      };
    }
    if (score >= 50) {
      return {
        level: 'Fair',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: AlertTriangle,
        bgIcon: 'bg-yellow-50',
      };
    }
    return {
      level: 'Poor',
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertCircle,
      bgIcon: 'bg-red-50',
    };
  };

  const info = getQualityInfo(score);
  const Icon = info.icon;

  return (
    <div className="group relative">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${info.color} cursor-help`}>
        <Icon className="w-4 h-4" />
        <span className="font-semibold">{score}%</span>
      </div>

      {/* Tooltip */}
      <div className={`absolute bottom-full left-0 mb-2 hidden group-hover:block ${info.bgIcon} border border-gray-300 rounded-lg shadow-lg p-3 w-64 z-50`}>
        <p className="font-semibold mb-2">{info.level} Quality</p>

        {isFlagged && (
          <div className="bg-red-50 border-l-2 border-red-500 p-2 mb-2 rounded">
            <p className="text-sm text-red-800 font-medium">Flagged for Review</p>
          </div>
        )}

        {issues && issues.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Issues:</p>
            <ul className="text-sm space-y-1">
              {issues.slice(0, 3).map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{issue}</span>
                </li>
              ))}
              {issues.length > 3 && (
                <li className="text-gray-600">+ {issues.length - 3} more</li>
              )}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-600 mt-2">
          Score based on data completeness, validity, and documentation.
        </p>
      </div>
    </div>
  );
}
