import React from 'react';
import { X, Home, LogOut, User, Settings, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isAdmin: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isAdmin, isOpen = false, onClose }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const handleClose = () => onClose?.();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#CFF4D2]/60">
          <h2 className="text-[15px] font-bold text-[#205072]">Account & Settings</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#f0faf5] rounded-lg transition-colors"
          >
            <X size={20} className="text-[#205072]" />
          </button>
        </div>

        {/* Account Info */}
        {user && (
          <div className="p-6 border-b border-[#CFF4D2]/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#329D9C] flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#205072]">
                  {isAdmin ? (user as any).username : (user as any).name}
                </p>
                <p className="text-[11px] text-[#56C596] gap-2 mt-0.5">
                  {isAdmin ? 'Administrator' : 'Enumerator'}
                </p>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-3">
              {isAdmin ? (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f0faf5]">
                    <div className="w-8 h-8 rounded-full bg-[#205072]/10 flex items-center justify-center">
                      <Settings size={14} className="text-[#205072]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Role</p>
                      <p className="text-[12px] font-semibold text-[#205072]">Full System Access</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f0faf5]">
                    <div className="w-8 h-8 rounded-full bg-[#56C596]/10 flex items-center justify-center">
                      <Mail size={14} className="text-[#56C596]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Email</p>
                      <p className="text-[11px] font-medium text-[#205072]">{(user as any).email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f0faf5]">
                    <div className="w-8 h-8 rounded-full bg-[#329D9C]/10 flex items-center justify-center">
                      <MapPin size={14} className="text-[#329D9C]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ward</p>
                      <p className="text-[11px] font-medium text-[#205072]">{(user as any).ward}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f0faf5]">
                    <div className="w-8 h-8 rounded-full bg-[#205072]/10 flex items-center justify-center">
                      <Phone size={14} className="text-[#205072]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Phone</p>
                      <p className="text-[11px] font-medium text-[#205072]">{(user as any).phone}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="p-6 border-b border-[#CFF4D2]/60">
          <h3 className="text-[12px] font-bold text-[#205072] uppercase tracking-wider mb-3">Settings</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#f0faf5] transition-colors text-left">
              <Settings size={16} className="text-[#329D9C]" />
              <span className="text-[13px] font-medium text-[#205072]">General Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#f0faf5] transition-colors text-left">
              <Home size={16} className="text-[#329D9C]" />
              <span className="text-[13px] font-medium text-[#205072]">Dashboard</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[13px] transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-center text-[10px] text-gray-400 font-medium">
            GeoWaste Kilifi v1.0
          </p>
        </div>
      </div>
    </>
  );
};
