import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { BoardPage } from './pages/BoardPage';
import { TeamDashboardPage } from './pages/TeamDashboardPage';
import { SnapshotDetailPage } from './pages/SnapshotDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ToastContainer } from './components/ToastContainer';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/board/:slug" element={<BoardPage />} />
        <Route path="/dashboard" element={<TeamDashboardPage />} />
        <Route path="/dashboard/:snapshotId" element={<SnapshotDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
