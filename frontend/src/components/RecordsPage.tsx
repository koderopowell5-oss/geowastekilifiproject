import React, { useMemo } from 'react';
import { FileText, Download, X } from 'lucide-react';
import {
  SubmissionRow,
  SurveyFieldSchema,
  getSortedFieldKeys,
  getFieldType,
  formatResponseValue,
  getRecordImageUrl,
  getRecordLocation,
  formatLocationValue,
} from '../utils/dynamicSurvey';

interface FieldCount {
  name: string;
  value: number;
}

interface RecordsPageProps {
  records: SubmissionRow[];
  fieldSchemas: SurveyFieldSchema[];
  dynamicFields?: FieldCount[];
}

export const RecordsPage: React.FC<RecordsPageProps> = ({ records, fieldSchemas, dynamicFields: dynamicFieldsProp }) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const dynamicFields = Array.isArray(dynamicFieldsProp) && dynamicFieldsProp.length > 0
    ? dynamicFieldsProp
    : [];

  const visibleFieldColumns = useMemo(() => {
    if (!records.length) return [];
    return getSortedFieldKeys(records, fieldSchemas, 6);
  }, [records, fieldSchemas]);

  const getImageUrl = (record: SubmissionRow) => getRecordImageUrl(record, fieldSchemas);
  const getLocationLabel = (record: SubmissionRow) => formatLocationValue(record, fieldSchemas);

  const formatCellValue = (record: SubmissionRow, key: string, type: string) => {
    if (key === 'id') return record.id;
    if (key === 'survey_title') return record.survey_title || '—';
    if (key === 'enumerator_email') return record.enumerator_email || '—';
    if (key === 'created_at') {
      return record.created_at ? new Date(String(record.created_at)).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
    }

    return formatResponseValue(record.response_data?.[key], type);
  };

  const exportToCSV = () => {
    if (records.length === 0) {
      alert('No records to export');
      return;
    }

    const columns = ['image_url', 'id', 'survey_title', 'enumerator_email', 'created_at', 'location', ...visibleFieldColumns.map((col) => col.key)];
    const headers = ['Image', 'ID', 'Form', 'Enumerator', 'Submitted', 'Location', ...visibleFieldColumns.map((col) => col.label)];

    const rows = records.map((record) =>
      columns.map((key) => {
        if (key === 'image_url') {
          return getImageUrl(record) || '—';
        }
        if (key === 'location') {
          return getLocationLabel(record);
        }
        const type = key === 'survey_title' || key === 'enumerator_email' || key === 'created_at' || key === 'location'
          ? 'text'
          : getFieldType(key, record.survey_id, fieldSchemas);
        return String(formatCellValue(record, key, type));
      })
    );

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) => row.map((cell) => {
        const cellStr = String(cell || '');
        return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
          ? `"${cellStr.replace(/"/g, '""')}"`
          : `"${cellStr}"`;
      }).join(',')),
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

  const renderHeaderCell = (key: string, label: string) => (
    <th key={key} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[11px] font-semibold text-[#205072] uppercase tracking-wide whitespace-nowrap border-b border-[#CFF4D2]/40">
      {label}
    </th>
  );

  const headerColumns = [
    { key: 'id', label: 'ID' },
    { key: 'survey_title', label: 'Form' },
    { key: 'enumerator_email', label: 'Enumerator' },
    { key: 'created_at', label: 'Submitted' },
    ...visibleFieldColumns.map((col) => ({ key: col.key, label: col.label }))
  ];

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#CFF4D2]/60 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#CFF4D2]/40 flex items-center justify-between bg-gradient-to-r from-[#f0faf5] to-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#329D9C]/10 flex items-center justify-center text-[#329D9C]">
            <FileText size={16} />
          </div>
          <div>
            <h2 className="text-[13px] sm:text-[14px] font-bold text-[#205072]">Enumerator Records</h2>
            <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">{records.length} submissions</p>
          </div>
        </div>
        {records.length > 0 && (
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
        {dynamicFields.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-[#CFF4D2]/30 bg-white">
            <div className="flex flex-wrap gap-2 items-center">
              {dynamicFields.map((f) => (
                <div key={f.name} className="text-[10px] sm:text-[11px] bg-[#f6fbf8] px-2 py-1 rounded-lg text-[#205072]">
                  {f.name.replace(/_/g, ' ')}: <span className="font-semibold">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

            <table className="w-full table-auto">
          <thead>
            <tr className="bg-[#f0faf5]">
              {headerColumns.map((col) => renderHeaderCell(col.key, col.label))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr
                key={record.id}
                className={`border-b border-[#CFF4D2]/30 hover:bg-[#f0faf5]/60 transition-colors ${idx % 2 === 0 ? '' : 'bg-[#f0faf5]/20'}`}
                data-latitude={record.latitude ?? getRecordLocation(record, fieldSchemas)?.latitude}
                data-longitude={record.longitude ?? getRecordLocation(record, fieldSchemas)?.longitude}
              >
                {headerColumns.map((col) => {
                  const imageUrl = col.key === 'image_url' ? getImageUrl(record) : undefined;
                  const locationLabel = col.key === 'location' ? getLocationLabel(record) : undefined;
                  const cellType = col.key === 'image_url' || col.key === 'location' || col.key === 'survey_title' || col.key === 'enumerator_email' || col.key === 'created_at'
                    ? 'text'
                    : getFieldType(col.key, record.survey_id, fieldSchemas);

                  return (
                    <td
                      key={col.key}
                      className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-[12px] text-[#205072] whitespace-nowrap max-w-[180px] overflow-hidden text-ellipsis"
                    >
                      {col.key === 'image_url' ? (
                        imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Record"
                            onClick={() => setSelectedImage(imageUrl)}
                            className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:shadow-md"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#f0faf5] flex items-center justify-center text-[#ccc] text-xs">—</div>
                        )
                      ) : col.key === 'location' ? (
                        <span>{locationLabel}</span>
                      ) : (
                        formatCellValue(record, col.key, cellType)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {records.length === 0 && (
          <div className="py-8 sm:py-16 text-center text-gray-400 text-[11px] sm:text-sm">No records found</div>
        )}
      </div>

      {records.length > 0 && (
        <div className="px-4 sm:px-6 py-2 sm:py-3 bg-[#f0faf5] border-t border-[#CFF4D2]/40">
          <p className="text-[10px] sm:text-[11px] text-gray-400">{records.length} total records</p>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-lg transition-colors z-10 shadow-md"
            >
              <X size={20} className="text-gray-600" />
            </button>
            <img src={selectedImage} alt="Full size" className="w-full h-auto" />
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">Click outside or the X button to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
