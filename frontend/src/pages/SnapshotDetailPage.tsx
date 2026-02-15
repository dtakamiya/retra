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
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/dashboard"
          className="text-indigo-500 hover:text-indigo-700 flex items-center gap-1 text-sm transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          ダッシュボードに戻る
        </Link>
        {loading && (
          <div className="text-center py-12">
            <div className="relative w-10 h-10 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 animate-spin" />
            </div>
            <p className="text-sm text-gray-400">読み込み中...</p>
          </div>
        )}
        {!loading && snapshot && <SnapshotDetailView snapshot={snapshot} />}
        {!loading && !snapshot && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">スナップショットが見つかりません</p>
          </div>
        )}
      </div>
    </div>
  );
}
