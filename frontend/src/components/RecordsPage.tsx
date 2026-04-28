import React from 'react';
import { WasteSiteRecord } from '../../../types';
import { FileText, Download, X } from 'lucide-react';

interface RecordsPageProps {
  sites: WasteSiteRecord[];
}

export const RecordsPage: React.FC<RecordsPageProps> = ({ sites }) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const formatArrayOrString = (data: any): string => {
    if (Array.isArray(data)) return data.join(', ');
    if (typeof data === 'string') return data;
    return '—';
  };

  const exportToCSV = () => {
    if (sites.length === 0) {
      alert('No records to export');
      return;
    }

    const headers = [
      'ID', 'Ward', 'Settlement Type', 'Household Size', 'Waste Types', 'Waste Quantity',
      'Waste Separation', 'Disposal Method', 'Distance to Site', 'Collection Frequency',
      'Road Access', 'Distance to Road', 'Waste Near Home', 'Distance to Waste', 'Impacts',
      'Nearby Features', 'Recommended Distance', 'Preferred Location', 'Distance Weight',
      'Water Weight', 'Road Weight', 'Slope Weight', 'Landuse Weight', 'Terrain', 'Flooding',
      'Policy Awareness', 'Support New Site', 'Preferred Management', 'Challenges',
      'Suggested Location', 'Latitude', 'Longitude', 'Image URL', 'Enumerator Email',
      'Created At', 'Updated At'
    ];

    const rows = sites.map(site => [
      site.id || '',
      site.ward || '',
      site.settlement_type || '',
      site.household_size || '',
      formatArrayOrString(site.waste_types),
      site.waste_quantity || '',
      site.waste_separation ? 'Yes' : 'No',
      site.disposal_method || '',
      site.distance_to_site || '',
      site.collection_frequency || '',
      site.road_access || '',
      site.distance_to_road || '',
      site.waste_near_home ? 'Yes' : 'No',
      site.distance_to_waste || '',
      formatArrayOrString(site.impacts),
      formatArrayOrString(site.nearby_features),
      site.recommended_distance || '',
      formatArrayOrString(site.preferred_location),
      site.distance_weight || '',
      site.water_weight || '',
      site.road_weight || '',
      site.slope_weight || '',
      site.landuse_weight || '',
      site.terrain || '',
      site.flooding || '',
      site.policy_awareness ? 'Yes' : 'No',
      site.support_new_site || '',
      site.preferred_management || '',
      (site.challenges || '').replace(/"/g, '""'), // Escape quotes
      (site.suggested_location || '').replace(/"/g, '""'),
      site.latitude || '',
      site.longitude || '',
      site.image_url || '',
      site.enumerator_email || '',
      site.created_at ? new Date(site.created_at).toISOString() : '',
      site.updated_at ? new Date(site.updated_at).toISOString() : '',
    ]);

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell || '');
        return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
          ? `"${cellStr.replace(/"/g, '""')}"`
          : `"${cellStr}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `geowaste-records-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        {sites.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#329D9C]/10 hover:bg-[#329D9C]/20 text-[#329D9C] rounded-lg transition-colors text-[11px] font-semibold"
            title="Export records to CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f0faf5]">
              {['Image', 'ID', 'Ward', 'Settlement', 'H/hold', 'Waste Types', 'Qty', 'Disposal', 'Coordinates', 'Date'].map((h) => (
                <th key={h} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[11px] font-semibold text-[#205072] uppercase tracking-wide whitespace-nowrap border-b border-[#CFF4D2]/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sites.map((site, idx) => (
              <tr key={site.id} className={`border-b border-[#CFF4D2]/30 hover:bg-[#f0faf5]/60 transition-colors ${idx % 2 === 0 ? '' : 'bg-[#f0faf5]/20'}`}>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  {site.image_url ? (
                    <img 
                      src={site.image_url} 
                      alt="Record" 
                      onClick={() => setSelectedImage(site.image_url!)}
                      className="w-10 h-10 rounded-lg object-cover hover:shadow-md transition-shadow cursor-pointer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#f0faf5] flex items-center justify-center text-[#ccc] text-xs">—</div>
                  )}
                </td>
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

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-lg transition-colors z-10 shadow-md"
            >
              <X size={20} className="text-gray-600" />
            </button>
            <img 
              src={selectedImage} 
              alt="Full size" 
              className="w-full h-auto"
            />
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">Click outside or the X button to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
