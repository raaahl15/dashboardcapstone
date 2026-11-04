import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { UserChip } from './components/common/UserChip';
import { ExportImportModal } from './components/layout/ExportImportModal';
import { ProfileModal } from './components/layout/ProfileModal';
import { LoginGateway } from './components/login/LoginGateway';
import { WorkOrderFormModal } from './components/workorders/WorkOrderFormModal';
import { WorkOrderDetailModal } from './components/workorders/WorkOrderDetailModal';
import { groupOfTab } from './components/layout/navigation';

const HomepageView = React.lazy(() =>
  import('./components/views/HomepageView').then((m) => ({ default: m.HomepageView }))
);
const WorkOrdersView = React.lazy(() =>
  import('./components/views/WorkOrdersView').then((m) => ({ default: m.WorkOrdersView }))
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
const DwsimStreamView = React.lazy(() =>
  import('./components/views/DwsimStreamView').then((m) => ({ default: m.DwsimStreamView }))
);
const MasterLibraryView = React.lazy(() =>
  import('./components/views/MasterLibraryView').then((m) => ({ default: m.MasterLibraryView }))
);
const GoogleWorkspaceView = React.lazy(() =>
  import('./components/views/GoogleWorkspaceView').then((m) => ({ default: m.GoogleWorkspaceView }))
);
const CalcResultsView = React.lazy(() =>
  import('./components/views/EngineeringDataViews').then((m) => ({ default: m.CalcResultsView }))
);
const TagValidationView = React.lazy(() =>
  import('./components/views/EngineeringDataViews').then((m) => ({ default: m.TagValidationView }))
);

/** Bar sub-tab untuk menu yang menggabungkan beberapa modul (Blueprint v2.4, LOG-032). */
const SubTabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const group = groupOfTab(activeTab);
  if (group.tabs.length < 2) return null;
  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-2"
      role="tablist"
      aria-label={`Sub-menu ${group.label}`}
    >
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A72] mr-1">{group.label}</span>
      {group.tabs.map((t) => {
        const active = t.key === activeTab;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setActiveTab(t.key)}
            className={`min-h-[44px] px-4 rounded-full text-xs font-bold transition-all ${
              active ? 'bg-[#0062CC] text-white shadow-xs' : 'bg-white/80 text-[#334155] border border-white hover:bg-white'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
}

class ChunkErrorBoundary extends React.Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ChunkErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Galat pemuatan modul view dinamis:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-white/80 rounded-3xl border border-white space-y-3 shadow-cockpit-card my-4">
          <h3 className="font-heading font-bold text-base text-[#0B1B33]">
            Pembaruan Versi Terdeteksi atau Modul Gagal Dimuat
          </h3>
          <p className="text-xs text-[#4A5A72] max-w-md">
            Aplikasi mendeteksi aset versi baru atau koneksi terputus saat memuat tampilan tab. Silakan muat ulang halaman untuk menggunakan versi teranyar.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full font-heading text-xs font-bold shadow-xs transition-all"
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
        <SubTabBar />
        <ChunkErrorBoundary>
          <React.Suspense
            fallback={
              <div className="min-h-[400px] flex items-center justify-center text-xs font-semibold text-[#4A5A72]">
                Memuat tampilan modul...
              </div>
            }
          >
            {activeTab === 'homepage' && <HomepageView />}
            {activeTab === 'work-orders' && <WorkOrdersView />}
            {activeTab === 'schedule' && <ScheduleView />}
            {activeTab === 'team-raci' && <TeamRaciView />}
            {activeTab === 'weekly-mom' && <WeeklyMoMView />}
            {activeTab === 'standards' && <StandardsView />}
            {activeTab === 'workspaces' && <WorkspacesView />}
            {activeTab === 'logbook' && <LogbookView />}
            {activeTab === 'stage-gate' && <StageGateView />}
            {activeTab === 'dwsim' && <DwsimStreamView />}
            {activeTab === 'calc' && <CalcResultsView />}
            {activeTab === 'tags' && <TagValidationView />}
            {activeTab === 'library' && <MasterLibraryView />}
            {activeTab === 'gworkspace' && <GoogleWorkspaceView />}
          </React.Suspense>
        </ChunkErrorBoundary>
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

      {/* Global Work Order Create/Edit & Detail Modals */}
      <WorkOrderFormModal />
      <WorkOrderDetailModal />
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
