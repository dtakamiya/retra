import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import { useWebSocket } from '../websocket/useWebSocket';
import { NicknameModal } from '../components/NicknameModal';
import { BoardHeader } from '../components/BoardHeader';
import { BoardView } from '../components/BoardView';
import { PhaseGuidance } from '../components/PhaseGuidance';
import { ParticipantList } from '../components/ParticipantList';
import { TimerDisplay } from '../components/TimerDisplay';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { CarryOverPanel } from '../components/CarryOverPanel';
import { BoardSkeleton } from '../components/BoardSkeleton';
import { KudosPanel } from '../components/KudosPanel';
import { useTimerAlert } from '../hooks/useTimerAlert';
import type { KudosCategory } from '../types';

export function BoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { board, participant, setBoard, setParticipant, setRemainingVotes, setTimer, isConnected, kudos, setKudos, needsRefresh, clearNeedsRefresh } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isKudosOpen, setIsKudosOpen] = useState(false);

  useWebSocket(slug, participant?.id);
  useTimerAlert();

  const loadBoard = useCallback(async () => {
    if (!slug) return;
    try {
      const savedParticipantId = localStorage.getItem(`retra-participant-${slug}`);
      const boardData = await api.getBoard(slug, savedParticipantId ?? undefined);
      setBoard(boardData);

      if (savedParticipantId) {
        const existing = boardData.participants.find((p) => p.id === savedParticipantId);
        if (existing) {
          setParticipant(existing);
        } else {
          localStorage.removeItem(`retra-participant-${slug}`);
          setShowNicknameModal(true);
        }
      } else {
        setShowNicknameModal(true);
      }

      // Load timer state
      const timerState = await api.getTimerState(slug);
      setTimer(timerState);

      // Load kudos
      const kudosData = await api.getKudos(slug);
      setKudos(kudosData);
    } catch {
      setError('ボードが見つかりません');
    } finally {
      setLoading(false);
    }
  }, [slug, setBoard, setParticipant, setTimer, setKudos]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Load remaining votes when participant is set and phase is VOTING
  useEffect(() => {
    if (slug && participant && board?.phase === 'VOTING') {
      api.getRemainingVotes(slug, participant.id).then(setRemainingVotes);
    }
  }, [slug, participant, board?.phase, setRemainingVotes]);

  // Re-fetch board when needsRefresh is set (e.g., phase transition to reveal private cards)
  useEffect(() => {
    if (!needsRefresh || !slug) return;
    let cancelled = false;
    const savedParticipantId = localStorage.getItem(`retra-participant-${slug}`);
    api.getBoard(slug, savedParticipantId ?? undefined).then((boardData) => {
      if (!cancelled) {
        setBoard(boardData);
        clearNeedsRefresh();
      }
    }).catch(() => {
      if (!cancelled) {
        clearNeedsRefresh();
      }
    });
    return () => { cancelled = true; };
  }, [needsRefresh, slug, setBoard, clearNeedsRefresh]);

  const handleJoin = async (nickname: string) => {
    if (!slug) return;
    try {
      const p = await api.joinBoard(slug, nickname);
      setParticipant(p);
      localStorage.setItem(`retra-participant-${slug}`, p.id);
      setShowNicknameModal(false);
      // Reload board to get updated participants
      const boardData = await api.getBoard(slug, p.id);
      setBoard(boardData);
      addToast('success', `${nickname} としてボードに参加しました`);
    } catch {
      addToast('error', 'ボードへの参加に失敗しました');
    }
  };

  const handleSendKudos = async (receiverId: string, category: KudosCategory, message?: string) => {
    if (!board || !participant) return;
    try {
      await api.sendKudos(board.slug, participant.id, receiverId, category, message);
    } catch {
      addToast('error', 'Kudosの送信に失敗しました');
    }
  };

  const handleDeleteKudos = async (kudosId: string) => {
    if (!board || !participant) return;
    try {
      await api.deleteKudos(board.slug, kudosId, participant.id);
    } catch {
      addToast('error', 'Kudosの削除に失敗しました');
    }
  };

  if (loading) {
    return <BoardSkeleton />;
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center animate-[scaleFadeIn_0.3s_ease-out]">
          <div className="text-5xl text-gray-200 dark:text-slate-700 font-bold mb-4">Oops</div>
          <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">{error || 'ボードが見つかりません'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-gray-100/50 dark:from-slate-900 dark:to-slate-900/95 flex flex-col">
      {!isConnected && <ConnectionBanner />}

      <BoardHeader
        isKudosOpen={isKudosOpen}
        kudosCount={kudos.length}
        onKudosToggle={() => setIsKudosOpen(!isKudosOpen)}
      />
      <PhaseGuidance phase={board.phase} />

      <div className="flex-1 flex">
        <div className="flex-1 overflow-x-auto">
          <BoardView />
        </div>
        <div className="hidden lg:block w-64 border-l border-gray-200/60 dark:border-slate-700/50 glass">
          <div className="p-4 space-y-0">
            <TimerDisplay />
            <ParticipantList />
            <CarryOverPanel />
          </div>
        </div>
      </div>

      {/* Mobile sidebar content */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-gray-100 dark:border-slate-700 p-3 flex items-center justify-between z-10">
        <TimerDisplay compact />
        <ParticipantList compact />
      </div>

      {showNicknameModal && (
        <NicknameModal onJoin={handleJoin} boardTitle={board.title} />
      )}

      {isKudosOpen && participant && (
        <KudosPanel
          kudos={kudos}
          participants={board.participants}
          currentParticipantId={participant.id}
          isAnonymous={board.isAnonymous}
          onSend={handleSendKudos}
          onDelete={handleDeleteKudos}
          onClose={() => setIsKudosOpen(false)}
        />
      )}
    </div>
  );
}
