import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useWebSocket } from '../websocket/useWebSocket';
import { NicknameModal } from '../components/NicknameModal';
import { BoardHeader } from '../components/BoardHeader';
import { BoardView } from '../components/BoardView';
import { ParticipantList } from '../components/ParticipantList';
import { TimerDisplay } from '../components/TimerDisplay';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { useTimerAlert } from '../hooks/useTimerAlert';

export function BoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { board, participant, setBoard, setParticipant, setRemainingVotes, setTimer, isConnected } = useBoardStore();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useWebSocket(slug, participant?.id);
  useTimerAlert();

  const loadBoard = useCallback(async () => {
    if (!slug) return;
    try {
      const boardData = await api.getBoard(slug);
      setBoard(boardData);

      // Check localStorage for existing participant
      const savedParticipantId = localStorage.getItem(`retra-participant-${slug}`);
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
    } catch {
      setError('Board not found');
    } finally {
      setLoading(false);
    }
  }, [slug, setBoard, setParticipant, setTimer]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Load remaining votes when participant is set and phase is VOTING
  useEffect(() => {
    if (slug && participant && board?.phase === 'VOTING') {
      api.getRemainingVotes(slug, participant.id).then(setRemainingVotes);
    }
  }, [slug, participant, board?.phase, setRemainingVotes]);

  const handleJoin = async (nickname: string) => {
    if (!slug) return;
    const p = await api.joinBoard(slug, nickname);
    setParticipant(p);
    localStorage.setItem(`retra-participant-${slug}`, p.id);
    setShowNicknameModal(false);
    // Reload board to get updated participants
    const boardData = await api.getBoard(slug);
    setBoard(boardData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">{error || 'Board not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isConnected && <ConnectionBanner />}

      <BoardHeader />

      <div className="flex-1 flex">
        <div className="flex-1 overflow-x-auto">
          <BoardView />
        </div>
        <div className="hidden lg:block w-64 border-l border-gray-200 bg-white">
          <div className="p-4">
            <TimerDisplay />
            <ParticipantList />
          </div>
        </div>
      </div>

      {/* Mobile sidebar content */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center justify-between z-10">
        <TimerDisplay compact />
        <ParticipantList compact />
      </div>

      {showNicknameModal && (
        <NicknameModal onJoin={handleJoin} boardTitle={board.title} />
      )}
    </div>
  );
}
