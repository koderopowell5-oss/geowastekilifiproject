import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { AlertCircle, MapPin, Loader2, X } from 'lucide-react';
import L from 'leaflet';
import { WasteSiteRecord } from '../../../types';
import { wasteApiService } from '../services/wasteApi';
import { useNotification } from '../context/NotificationContext';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom teal marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [0, -34],
  shadowSize: [32, 32],
});

interface MapProps {
  onMarkerClick?: (record: WasteSiteRecord) => void;
  onClose?: () => void;
  hideHeader?: boolean;
}

export const WasteMap: React.FC<MapProps> = ({ onMarkerClick, onClose, hideHeader = false }) => {
  const [sites, setSites] = useState<WasteSiteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();
  const [error, setError] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<WasteSiteRecord | null>(null);

  const mapCenterLat = parseFloat(process.env.REACT_APP_MAP_CENTER_LAT || '-3.2869');
  const mapCenterLng = parseFloat(process.env.REACT_APP_MAP_CENTER_LNG || '39.6568');
  const mapZoom = parseInt(process.env.REACT_APP_MAP_ZOOM || '13');

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const { records } = await wasteApiService.getAllWasteSites(1000, 0);
        setSites(records);
        setError(null);
      } catch (err: any) {
        const errMsg = err.message || 'Failed to load waste sites';
        setError(errMsg);
        showError(errMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const formatTypes = (val: string | string[] | undefined): string => {
    if (!val) return '—';
    if (Array.isArray(val)) return val.join(', ');
    return val;
  };

  const settlementColor = (type: string) => {
    if (type === 'Formal') return { bg: 'bg-[#205072]/10', text: 'text-[#205072]' };
    if (type === 'Informal') return { bg: 'bg-[#329D9C]/10', text: 'text-[#329D9C]' };
    return { bg: 'bg-[#56C596]/10', text: 'text-[#56C596]' };
  };

  if (error && !sites.length) {
    return (
      <div className="min-h-screen bg-[#f0faf5] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-sm max-w-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0faf5] font-sans flex flex-col">
      {/* Header */}
      {!hideHeader && <div className="bg-white border-b border-[#CFF4D2]/60 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#329D9C] flex items-center justify-center">
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-[#205072] leading-none">Waste Site Map</h1>
              <p className="text-[11px] text-[#56C596] mt-0.5 leading-none">
                {loading ? 'Loading sites…' : `${sites.length} sites mapped`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-[#f0faf5] border border-[#CFF4D2]/60">
              {[
                { label: 'Formal', color: '#205072' },
                { label: 'Informal', color: '#329D9C' },
                { label: 'Peri-urban', color: '#56C596' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-medium text-[#205072]">{item.label}</span>
                </div>
              ))}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>}

      {/* Map + Side Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white border border-[#CFF4D2] rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <Loader2 size={14} className="text-[#329D9C] animate-spin" />
            <span className="text-[12px] font-medium text-[#205072]">Loading sites…</span>
          </div>
        )}

        {/* Map */}
        <div className="flex-1">
          <MapContainer
            center={[mapCenterLat, mapCenterLng]}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%', minHeight: 'calc(100vh - 73px)' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {sites.map((site) => (
              <Marker
                key={site.id}
                position={[site.latitude, site.longitude]}
                icon={customIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedSite(site);
                    onMarkerClick?.(site);
                  },
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[160px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-md bg-[#329D9C] flex items-center justify-center">
                        <MapPin size={11} color="white" />
                      </div>
                      <span className="text-[13px] font-bold text-[#205072]">Site #{site.id}</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <p><span className="text-gray-400 font-medium">Ward:</span> <span className="text-[#205072] font-semibold">{site.ward}</span></p>
                      <p><span className="text-gray-400 font-medium">Disposal:</span> <span className="text-[#205072]">{site.disposal_method}</span></p>
                      <p><span className="text-gray-400 font-medium">Settlement:</span> <span className="text-[#205072]">{site.settlement_type}</span></p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>


        {/* Node Detail Modal */}
        {selectedSite && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#329D9C] to-[#56C596] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/80 font-medium">Selected site</p>
                  <h2 className="text-[16px] font-bold text-white">Site #{selectedSite.id}</h2>
                </div>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Location */}
                <div className="p-3.5 rounded-2xl bg-[#f0faf5] border border-[#CFF4D2]/60">
                  <p className="text-[10px] font-bold text-[#56C596] uppercase tracking-wider mb-2">Location</p>
                  <p className="text-[13px] font-bold text-[#205072] mb-1">{selectedSite.ward}</p>
                  <p className="text-[10px] font-mono text-gray-400">
                    {(+selectedSite.latitude).toFixed(5)}, {(+selectedSite.longitude).toFixed(5)}
                  </p>
                </div>

                {/* Settlement type */}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-gray-500">Settlement</span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${settlementColor(selectedSite.settlement_type).bg} ${settlementColor(selectedSite.settlement_type).text}`}>
                    {selectedSite.settlement_type}
                  </span>
                </div>

                <div className="h-px bg-[#CFF4D2]/40" />

                {/* Details grid */}
                {[
                  { label: 'Disposal Method', value: selectedSite.disposal_method },
                  { label: 'Household Size', value: selectedSite.household_size },
                  { label: 'Waste Quantity', value: selectedSite.waste_quantity },
                  { label: 'Collection', value: selectedSite.collection_frequency },
                  { label: 'Road Access', value: selectedSite.road_access },
                  { label: 'Flooding', value: selectedSite.flooding },
                ].map((item) => (
                  item.value ? (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-400 font-medium">{item.label}</span>
                      <span className="text-[12px] font-semibold text-[#205072]">{item.value}</span>
                    </div>
                  ) : null
                ))}

                <div className="h-px bg-[#CFF4D2]/40" />

                {/* Waste types */}
                {selectedSite.waste_types && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Waste Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formatTypes(selectedSite.waste_types as string | string[]).split(', ').filter(Boolean).map((t) => (
                        <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#329D9C]/10 text-[#329D9C]">{t.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impacts */}
                {selectedSite.impacts && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Impacts</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formatTypes(selectedSite.impacts as string | string[]).split(', ').filter(Boolean).map((t) => (
                        <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-400">{t.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date */}
                {selectedSite.created_at && (
                  <div className="pt-1">
                    <p className="text-[10px] text-gray-300 text-center">
                      Recorded {new Date(selectedSite.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom count bar */}
      {!loading && (
        <div className="bg-white border-t border-[#CFF4D2]/60 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-[11px] text-gray-400">
              Showing <span className="font-bold text-[#329D9C]">{sites.length}</span> waste sites in Kilifi Municipality
            </p>
            {error && (
              <p className="text-[11px] text-amber-500 flex items-center gap-1">
                <AlertCircle size={12} /> Some data may be incomplete
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};