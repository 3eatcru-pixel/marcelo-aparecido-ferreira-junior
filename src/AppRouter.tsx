import React, { Suspense, lazy } from 'react';
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


export function AppRouter() {
  return (
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
  );
}
