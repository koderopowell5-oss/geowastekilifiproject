import React, { useState } from 'react';
import { Home, MapPin, Edit3, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Dashboard } from './Dashboard';
import { WasteSurveyForm } from './WasteSurveyForm';
import { WasteMap } from './WasteMap';
import { ProfileTab } from './ProfileTab';
import { FloatingTabBar } from './FloatingTabBar';
import { CollectionsPage } from './CollectionsPage';

export const EnumeratorDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [editingDraftId, setEditingDraftId] = useState<string | undefined>();
  const [editingDraftData, setEditingDraftData] = useState<any>();
  const [showCollections, setShowCollections] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  const handleEditDraft = (draftId: string, formData: Record<string, any>) => {
    setEditingDraftId(draftId);
    setEditingDraftData(formData);
    setShowCollections(false);
  };

  const handleStartNew = () => {
    setEditingDraftId(undefined);
    setEditingDraftData(undefined);
    setShowCollections(false);
  };

  const handleSurveySuccess = () => {
    setEditingDraftId(undefined);
    setEditingDraftData(undefined);
    setCurrentPage('home');
  };

  // Don't show enumerator dashboard if admin
  if (isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f0faf5] font-sans">
      {/* Header */}
      <div className="bg-white border-b border-[#CFF4D2]/60 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#329D9C] flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[14px] sm:text-[15px] font-bold text-[#205072] leading-none truncate">GeoWaste Kilifi</h1>
              <p className="text-[10px] sm:text-[11px] text-[#56C596] mt-0.5 leading-none">Field Collection</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#f0faf5] border border-[#CFF4D2]/60">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#329D9C] flex items-center justify-center shrink-0">
                <User size={12} className="text-white" />
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#205072] leading-none truncate">{(user as any)?.name || 'Enumerator'}</p>
                <p className="text-[8px] sm:text-[9px] text-[#56C596] mt-0.5 leading-none">{(user as any)?.ward || 'Ward'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] font-medium border border-[#CFF4D2] text-[#205072] hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
            >
              <LogOut size={13} /> <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with FloatingTabBar */}
      <div className="pb-32 sm:pb-6">
        <FloatingTabBar
          tabs={[
            {
              id: 'home',
              label: 'Home',
              icon: <Home size={20} className="sm:w-[18px] sm:h-[18px]" />,
              content: (
              <div className="min-h-screen flex flex-col items-center justify-center px-4">
                
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 sm:mb-6">
                  <img 
                    src="images/home.svg" 
                    alt="Home Dashboard"
                    className="w-full h-auto object-contain mx-auto"
                  />
                </div>

                <div className="w-full max-w-md">
                  <Dashboard hideHeader={true} />
                </div>

              </div>
              ),
            },
            {
              id: 'survey',
              label: 'Survey',
              icon: <Edit3 size={20} className="sm:w-[18px] sm:h-[18px]" />,
              content: showCollections ? (
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                  <button
                    onClick={() => setShowCollections(false)}
                    className="mb-6 text-sm font-medium text-[#329D9C] hover:text-[#205072] transition-colors flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <CollectionsPage onEditDraft={handleEditDraft} onStartNew={handleStartNew} />
                </div>
              ) : (
                <>
                  <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 sm:mb-6">
                    <img 
                      src="images/survey.svg" 
                      alt="Survey"
                      className="w-full h-auto object-contain mx-auto"
                    />
                  </div>
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <WasteSurveyForm 
                      hideHeader={true}
                      draftId={editingDraftId}
                      initialData={editingDraftData}
                      userEmail={(user as any)?.email}
                      onSubmitSuccess={handleSurveySuccess}
                    />
                    <div className="mt-6 pt-6 border-t border-[#CFF4D2]/60 flex justify-center">
                      <button
                        onClick={() => setShowCollections(true)}
                        className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#56C596] hover:bg-[#329D9C] text-white text-sm font-semibold rounded transition-all"
                      >
                        View My Collections
                      </button>
                    </div>
                  </div>
                </>
              ),
            },
            {
              id: 'map',
              label: 'Map',
              icon: <MapPin size={20} className="sm:w-[18px] sm:h-[18px]" />,
              content: (
                <>
                  <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 sm:mb-6">
                    <img 
                      src="images/map.svg" 
                      alt="Map"
                      className="w-full h-auto object-contain mx-auto"
                    />
                  </div>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#CFF4D2]/60 overflow-hidden h-[calc(100vh-200px)]">
                      <WasteMap hideHeader={true} />
                    </div>
                  </div>
                </>
              ),
            },
            {
              id: 'profile',
              label: 'Profile',
              icon: <Settings size={20} className="sm:w-[18px] sm:h-[18px]" />,
              content: (
                <>
                  <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 sm:mb-6">
                    <img 
                      src="images/profile.svg" 
                      alt="Profile"
                      className="w-full h-auto object-contain mx-auto"
                    />
                  </div>
                  <ProfileTab />
                </>
              ),
            },
          ]}
          currentTab={currentPage}
          onTabChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
