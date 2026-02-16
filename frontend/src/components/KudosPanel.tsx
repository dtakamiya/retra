import { useState } from 'react';
import { X, Heart } from 'lucide-react';
import type { Kudos, KudosCategory, Participant } from '../types';
import { KudosCard } from './KudosCard';
import { KudosSendForm } from './KudosSendForm';

interface Props {
  kudos: Kudos[];
  participants: Participant[];
  currentParticipantId: string;
  isAnonymous: boolean;
  onSend: (receiverId: string, category: KudosCategory, message?: string) => void;
  onDelete: (kudosId: string) => void;
  onClose: () => void;
}

export function KudosPanel({ kudos, participants, currentParticipantId, isAnonymous, onSend, onDelete, onClose }: Props) {
  const [showForm, setShowForm] = useState(false);

  const handleSend = (receiverId: string, category: KudosCategory, message?: string) => {
    onSend(receiverId, category, message);
    setShowForm(false);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-gray-200 dark:border-slate-700 shadow-xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Kudos</h2>
          {kudos.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
              {kudos.length}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="パネルを閉じる"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 py-3">
        {showForm ? (
          <KudosSendForm
            participants={participants}
            currentParticipantId={currentParticipantId}
            onSend={handleSend}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full px-3 py-2 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Kudosを送る
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {kudos.length === 0 ? (
          <p className="text-center text-xs text-gray-400 dark:text-slate-500 py-8">
            まだKudosがありません
          </p>
        ) : (
          kudos.map((k) => (
            <KudosCard
              key={k.id}
              kudos={k}
              currentParticipantId={currentParticipantId}
              isAnonymous={isAnonymous}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
