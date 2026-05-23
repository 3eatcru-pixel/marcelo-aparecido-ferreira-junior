import React, { Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Reader } from '@/features/discover/pages/Reader';

// Lazy imports for heavy modules
const Discover = lazy(() => import('@/features/discover/pages/Discover').then(m => ({ default: m.Discover })));
const Trending = lazy(() => import('@/features/discover/pages/Trending').then(m => ({ default: m.Trending })));
const WorkDetail = lazy(() => import('@/features/discover/pages/WorkDetail').then(m => ({ default: m.WorkDetail })));
const Events = lazy(() => import('@/features/community/pages/Events').then(m => ({ default: m.Events })));
const Community = lazy(() => import('@/features/community/pages/Community').then(m => ({ default: m.Community })));
const Favorites = lazy(() => import('@/features/library/pages/Favorites').then(m => ({ default: m.Favorites })));
const Comments = lazy(() => import('@/features/library/pages/Comments').then(m => ({ default: m.Comments })));
const History = lazy(() => import('@/features/library/pages/History').then(m => ({ default: m.History })));
const Collections = lazy(() => import('@/features/library/pages/Collections').then(m => ({ default: m.Collections })));
const DriveSync = lazy(() => import('@/features/library/pages/DriveSync').then(m => ({ default: m.DriveSync })));
const BecomeCreator = lazy(() => import('@/features/auth/pages/BecomeCreator').then(m => ({ default: m.BecomeCreator })));
const MyWorks = lazy(() => import('@/features/projects/pages/MyWorks').then(m => ({ default: m.MyWorks })));
const NovelEditor = lazy(() => import('@/features/novel/pages/NovelEditor').then(m => ({ default: m.NovelEditor })));
const StoryOverview = lazy(() => import('@/features/novel/pages/StoryOverview'));
const StoryBible = lazy(() => import('@/features/novel/pages/StoryBible').then(m => ({ default: m.StoryBible })));
const AIScriptPanelStudio = lazy(() => import('@/features/aistudio/pages/AIScriptPanelStudio').then(m => ({ default: m.AIScriptPanelStudio })));
const MangaEditor = lazy(() => import('@/features/manga/pages/MangaEditor').then(m => ({ default: m.MangaEditor })));
const AIStudio = lazy(() => import('@/features/aistudio/pages/AIStudio').then(m => ({ default: m.AIStudio })));
const PublishStory = lazy(() => import('@/features/publish/pages/PublishStory').then(m => ({ default: m.PublishStory })));
const Analytics = lazy(() => import('@/features/analytics/pages/Analytics').then(m => ({ default: m.Analytics })));
const Monetization = lazy(() => import('@/features/analytics/pages/Monetization').then(m => ({ default: m.Monetization })));
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Projects = lazy(() => import('@/features/projects/pages/Projects').then(m => ({ default: m.Projects })));
const Settings = lazy(() => import('@/features/profile/pages/Settings').then(m => ({ default: m.Settings })));
const Search = lazy(() => import('@/features/search/pages/Search').then(m => ({ default: m.Search })));
const Notifications = lazy(() => import('@/features/notifications/pages/Notifications').then(m => ({ default: m.Notifications })));
const Messaging = lazy(() => import('@/features/messaging/pages/Messaging').then(m => ({ default: m.Messaging })));
const Profile = lazy(() => import('@/features/profile/pages/Profile').then(m => ({ default: m.Profile })));
const Followers = lazy(() => import('@/features/profile/pages/Followers').then(m => ({ default: m.Followers })));

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled lazy/chunk loader error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] text-white p-6 text-center select-none">
          <div className="max-w-md w-full border border-red-500/20 bg-red-500/5 rounded-2xl p-8 flex flex-col items-center gap-6 backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="flex flex-col gap-2">
              <h2 id="error-boundary-title" className="text-sm font-bold text-white uppercase tracking-wider">Falha no Carregamento</h2>
              <p className="text-gray-400 text-xs leading-relaxed">
                Houve um problema ao sincronizar ou renderizar este segmento da plataforma. Isso costuma ocorrer devido a arquivos desatualizados no cache.
              </p>
              {this.state.error?.message && (
                <div className="mt-2 p-2.5 bg-black/40 rounded-xl border border-white/5 text-left font-mono text-[10px] text-red-400 max-h-24 overflow-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <button
              id="reload-app-button"
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-red-600/20 cursor-pointer"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AppRouter() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-manga-bg text-white"><div className="animate-pulse">Loading…</div></div>}>
        <Routes>
          <Route element={<AppLayout />}> 
            <Route path="/" element={<Navigate to="/discover" replace />} />
            {/* Public Layout Routes */}
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:uid" element={<Profile />} />
            <Route path="/followers" element={<Followers />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/work/:id" element={<WorkDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/community" element={<Community />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/history" element={<History />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/drive-sync" element={<DriveSync />} />
            <Route path="/become-creator" element={<BecomeCreator />} />
            {/* Creator & Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CREATOR']} />}> 
              <Route path="/dashboard" element={<MyWorks />} />
              <Route path="/novel-studio" element={<Navigate to="/dashboard" replace />} />
              <Route path="/novel-studio/:id/overview" element={<StoryOverview />} />
              <Route path="/novel-studio/:id" element={<NovelEditor />} />
              <Route path="/novel-studio/:id/bible" element={<StoryBible />} />
              <Route path="/novel-studio/:id/ai-script" element={<AIScriptPanelStudio />} />
              <Route path="/manga-studio" element={<Navigate to="/dashboard" replace />} />
              <Route path="/manga-studio/:id" element={<MangaEditor />} />
              <Route path="/manga-studio/:id/bible" element={<StoryBible />} />
              <Route path="/ai-studio" element={<AIStudio />} />
              <Route path="/publish" element={<PublishStory />} />
              <Route path="/analytics" element={<Analytics />} />
            </Route>
            <Route path="/monetization" element={<Monetization />} />
            {/* Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}> 
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/projects" element={<Projects />} />
            </Route>
            {/* Fallback */}
            <Route path="*" element={<div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full"><h1 className="text-2xl font-bold text-white mb-2">Página em Desenvolvimento</h1><p>Essa rota não existe ou ainda não foi implementada.</p></div>} />
          </Route>
          {/* Full Screen Reading */}
          <Route path="/read/:id" element={<Reader />} />
          <Route path="/read/:workId/:chapterId" element={<Reader />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
