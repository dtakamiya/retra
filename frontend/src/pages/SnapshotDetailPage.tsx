import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import { SnapshotDetailView } from '../components/SnapshotDetailView';
import type { SnapshotDetail } from '../types';

export function SnapshotDetailPage() {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const [snapshot, setSnapshot] = useState<SnapshotDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (snapshotId) {
      api.getSnapshot(snapshotId)
        .then(setSnapshot)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [snapshotId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 mb-4 transition-colors">
          <ArrowLeft size={16} />
          ダッシュボードに戻る
        </Link>
        {loading && <div className="text-center py-8 text-gray-500 dark:text-slate-400">読み込み中...</div>}
        {!loading && snapshot && <SnapshotDetailView snapshot={snapshot} />}
        {!loading && !snapshot && <div className="text-center py-8 text-gray-500 dark:text-slate-400">スナップショットが見つかりません</div>}
      </div>
    </div>
  );
}
