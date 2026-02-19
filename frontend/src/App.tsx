import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ToastContainer } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';

const BoardPage = lazy(() => import('./pages/BoardPage').then(m => ({ default: m.BoardPage })));
const TeamDashboardPage = lazy(() => import('./pages/TeamDashboardPage').then(m => ({ default: m.TeamDashboardPage })));
const SnapshotDetailPage = lazy(() => import('./pages/SnapshotDetailPage').then(m => ({ default: m.SnapshotDetailPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/board/:slug" element={<BoardPage />} />
            <Route path="/dashboard" element={<TeamDashboardPage />} />
            <Route path="/dashboard/:snapshotId" element={<SnapshotDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
