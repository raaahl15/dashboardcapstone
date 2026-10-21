import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { UserChip } from './components/common/UserChip';
import { ExportImportModal } from './components/layout/ExportImportModal';
import { ProfileModal } from './components/layout/ProfileModal';
import { LoginGateway } from './components/login/LoginGateway';

const HomepageView = React.lazy(() =>
  import('./components/views/HomepageView').then((m) => ({ default: m.HomepageView }))
);
const ScheduleView = React.lazy(() =>
  import('./components/views/ScheduleView').then((m) => ({ default: m.ScheduleView }))
);
const TeamRaciView = React.lazy(() =>
  import('./components/views/TeamRaciView').then((m) => ({ default: m.TeamRaciView }))
);
const WeeklyMoMView = React.lazy(() =>
  import('./components/views/WeeklyMoMView').then((m) => ({ default: m.WeeklyMoMView }))
);
const StandardsView = React.lazy(() =>
  import('./components/views/StandardsView').then((m) => ({ default: m.StandardsView }))
);
const WorkspacesView = React.lazy(() =>
  import('./components/views/WorkspacesView').then((m) => ({ default: m.WorkspacesView }))
);
const LogbookView = React.lazy(() =>
  import('./components/views/LogbookView').then((m) => ({ default: m.LogbookView }))
);
const StageGateView = React.lazy(() =>
  import('./components/views/StageGateView').then((m) => ({ default: m.StageGateView }))
);

const MainApp: React.FC = () => {
  const { isLoggedIn, isLoading, isDataLoaded, authError, syncError, logout, activeTab } = useApp();
  const [showExportImport, setShowExportImport] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#4A5A72]">
        Menghubungkan ke Firebase...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginGateway />;
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center text-[#0B1B33]">
        <h1 className="font-heading text-xl font-bold">Data proyek belum dapat dimuat</h1>
        <p className="max-w-xl text-sm text-[#4A5A72]">
          {syncError || 'Periksa koneksi internet dan aturan akses Firestore, lalu coba lagi.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="min-h-[44px] rounded-full bg-[#0062CC] px-5 py-2 text-sm font-semibold text-white"
          >
            Coba lagi
          </button>
          <button
            onClick={() => {
              void logout();
            }}
            className="min-h-[44px] rounded-full border border-[#6B7F99] px-5 py-2 text-sm font-semibold"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sexy-blue min-h-screen text-[#0B1B33] flex flex-col antialiased">
      {(syncError || authError) && (
        <div
          className="bg-[#FEE2E2] px-4 py-2 text-center text-xs font-semibold text-[#991B1B]"
          role="alert"
        >
          {syncError
            ? `Perubahan belum tersinkron ke server: ${syncError}`
            : `Status autentikasi: ${authError}`}
        </div>
      )}
      {/* Sticky Header with Pill Navigation */}
      <Header
        onOpenExportImport={() => setShowExportImport(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6">
        <React.Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center text-xs font-semibold text-[#4A5A72]">
              Memuat tampilan modul...
            </div>
          }
        >
          {activeTab === 'homepage' && <HomepageView />}
          {activeTab === 'schedule' && <ScheduleView />}
          {activeTab === 'team-raci' && <TeamRaciView />}
          {activeTab === 'weekly-mom' && <WeeklyMoMView />}
          {activeTab === 'standards' && <StandardsView />}
          {activeTab === 'workspaces' && <WorkspacesView />}
          {activeTab === 'logbook' && <LogbookView />}
          {activeTab === 'stage-gate' && <StageGateView />}
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 text-center text-xs text-[#334155] border-t border-white/70 bg-white/75 backdrop-blur-xs mt-10">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="font-heading font-extrabold text-[#0B1B33]">
              Dashboard Capstone Area 1
            </span>
            <span>•</span>
            <span>Created by</span>
            <UserChip
              uid="user-rahul"
              variant="avatar-nama-jabatan"
              size="xs"
              inlineTitle
              avatarClassName="hidden"
              nameClassName="!text-xs !font-semibold !text-[#0B1B33]"
              titleClassName="!text-xs !text-[#4A5A72]"
            />
          </div>
          <div>
            <span>
              DTNTF Capstone Design Repository © 2026/2027 • Departemen Teknik Nuklir dan Teknik Fisika UGM
            </span>
          </div>
        </div>
      </footer>

      {/* JSON Backup & Restore Modal */}
      <ExportImportModal
        isOpen={showExportImport}
        onClose={() => setShowExportImport(false)}
      />

      {/* User Profile & Position Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
