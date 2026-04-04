import React from 'react';
import { WasteSiteRecord } from '../../../types';
import { FileText } from 'lucide-react';

interface RecordsPageProps {
  sites: WasteSiteRecord[];
}

export const RecordsPage: React.FC<RecordsPageProps> = ({ sites }) => {
  const formatArrayOrString = (data: any): string => {
    if (Array.isArray(data)) return data.join(', ');
    if (typeof data === 'string') return data;
    return '—';
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#CFF4D2]/60 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#CFF4D2]/40 flex items-center justify-between bg-gradient-to-r from-[#f0faf5] to-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#329D9C]/10 flex items-center justify-center text-[#329D9C]">
            <FileText size={16} />
          </div>
          <div>
            <h2 className="text-[13px] sm:text-[14px] font-bold text-[#205072]">Enumerator Records</h2>
            <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">{sites.length} submissions</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f0faf5]">
              {['ID', 'Ward', 'Settlement', 'H/hold', 'Waste Types', 'Qty', 'Disposal', 'Coordinates', 'Date'].map((h) => (
                <th key={h} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[11px] font-semibold text-[#205072] uppercase tracking-wide whitespace-nowrap border-b border-[#CFF4D2]/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sites.map((site, idx) => (
              <tr key={site.id} className={`border-b border-[#CFF4D2]/30 hover:bg-[#f0faf5]/60 transition-colors ${idx % 2 === 0 ? '' : 'bg-[#f0faf5]/20'}`}>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <span className="text-[9px] sm:text-[11px] font-bold text-white bg-[#329D9C] px-2 py-0.5 rounded-lg">{site.id}</span>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-[12px] font-medium text-[#205072] whitespace-nowrap">{site.ward}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <span className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                    site.settlement_type === 'Formal' ? 'bg-[#205072]/10 text-[#205072]' :
                    site.settlement_type === 'Informal' ? 'bg-[#329D9C]/10 text-[#329D9C]' :
                    'bg-[#56C596]/10 text-[#56C596]'
                  }`}>{site.settlement_type}</span>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-[12px] text-gray-500">{site.household_size}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[11px] text-gray-500 max-w-[100px] sm:max-w-[140px] truncate">{formatArrayOrString(site.waste_types)}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[11px] text-gray-500 whitespace-nowrap">{site.waste_quantity || '—'}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-[12px] text-[#205072] whitespace-nowrap">{site.disposal_method}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-[8px] sm:text-[10px] font-mono text-gray-400 whitespace-nowrap">
                  {(+site.latitude).toFixed(4)}, {(+site.longitude).toFixed(4)}
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[11px] text-gray-400 whitespace-nowrap">
                  {site.created_at ? new Date(site.created_at as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sites.length === 0 && (
          <div className="py-8 sm:py-16 text-center text-gray-400 text-[11px] sm:text-sm">No records found</div>
        )}
      </div>
      {sites.length > 0 && (
        <div className="px-4 sm:px-6 py-2 sm:py-3 bg-[#f0faf5] border-t border-[#CFF4D2]/40">
          <p className="text-[10px] sm:text-[11px] text-gray-400">{sites.length} total records</p>
        </div>
      )}
    </div>
  );
};
