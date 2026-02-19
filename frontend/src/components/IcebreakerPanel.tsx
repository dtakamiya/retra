import { Dice5, MessageCircle, Pencil, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import { CharacterCounter } from './CharacterCounter';

const MAX_ANSWER_LENGTH = 140;

export function IcebreakerPanel() {
  const { board, participant, icebreakerQuestion, icebreakerAnswers, setIcebreaker } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [answerText, setAnswerText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!board) return;
    api.getIcebreaker(board.slug).then(setIcebreaker).catch(() => {});
  }, [board, setIcebreaker]);

  if (!board || !participant) return null;

  const isFacilitator = participant.isFacilitator;
  const myAnswer = icebreakerAnswers.find((a) => a.participantId === participant.id);

  const handleSetRandomQuestion = async () => {
    setLoading(true);
    try {
      const res = await api.setIcebreakerQuestion(board.slug, participant.id, 'RANDOM');
      setIcebreaker(res);
    } catch {
      addToast('error', '質問の設定に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    const trimmed = answerText.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await api.submitIcebreakerAnswer(board.slug, participant.id, trimmed);
      setAnswerText('');
    } catch {
      addToast('error', '回答の送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnswer = async (answerId: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await api.updateIcebreakerAnswer(board.slug, answerId, participant.id, trimmed);
      setEditingId(null);
      setEditText('');
    } catch {
      addToast('error', '回答の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    setLoading(true);
    try {
      await api.deleteIcebreakerAnswer(board.slug, answerId, participant.id);
    } catch {
      addToast('error', '回答の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6" data-testid="icebreaker-panel">
      {/* Question section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
          <MessageCircle size={20} />
          <h2 className="text-lg font-semibold">アイスブレイク</h2>
        </div>

        {icebreakerQuestion ? (
          <p className="text-xl font-medium text-gray-900 dark:text-slate-100">{icebreakerQuestion}</p>
        ) : (
          <p className="text-gray-500 dark:text-slate-400">ファシリテーターが質問を設定するのを待っています...</p>
        )}

        {isFacilitator && (
          <button
            onClick={handleSetRandomQuestion}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
            aria-label="ランダム質問を設定"
          >
            <Dice5 size={16} />
            {icebreakerQuestion ? '別の質問に変更' : 'ランダム質問を設定'}
          </button>
        )}
      </div>

      {/* Answer input */}
      {icebreakerQuestion && !myAnswer && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSubmitAnswer()}
              placeholder="回答を入力..."
              maxLength={MAX_ANSWER_LENGTH}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              aria-label="アイスブレイク回答"
            />
            <div className="absolute right-2 bottom-1">
              <CharacterCounter current={answerText.length} max={MAX_ANSWER_LENGTH} />
            </div>
          </div>
          <button
            onClick={handleSubmitAnswer}
            disabled={loading || !answerText.trim()}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            aria-label="回答を送信"
          >
            <Send size={16} />
          </button>
        </div>
      )}

      {/* Answers list */}
      {icebreakerAnswers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400">
            みんなの回答 ({icebreakerAnswers.length})
          </h3>
          <div className="space-y-2">
            {icebreakerAnswers.map((answer) => (
              <div
                key={answer.id}
                className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                data-testid={`icebreaker-answer-${answer.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                    {answer.participantNickname}
                  </p>
                  {editingId === answer.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleUpdateAnswer(answer.id)}
                        maxLength={MAX_ANSWER_LENGTH}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-slate-100"
                        aria-label="回答を編集"
                      />
                      <button
                        onClick={() => handleUpdateAnswer(answer.id)}
                        disabled={loading || !editText.trim()}
                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditText(''); }}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 rounded hover:bg-gray-300 dark:hover:bg-slate-500"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-slate-100">{answer.answerText}</p>
                  )}
                </div>
                {answer.participantId === participant.id && editingId !== answer.id && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingId(answer.id); setEditText(answer.answerText); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      aria-label="回答を編集"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAnswer(answer.id)}
                      disabled={loading}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                      aria-label="回答を削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
