import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { ColumnView } from './ColumnView';
import { CardItem } from './CardItem';
import type { Board, Card, Column } from '../types';

const DRAG_ACTIVATION_DISTANCE = 8;
const ERROR_DISPLAY_DURATION_MS = 5000;

/**
 * over.id がカラムIDかカードIDかを判定し、対象カラムを返す。
 */
function findTargetColumn(
  board: Board,
  overId: string,
  findColumnByCardId: (cardId: string) => Column | null | undefined
): Column | undefined {
  const columnById = board.columns.find((col) => col.id === overId);
  if (columnById) return columnById;

  const columnByCard = findColumnByCardId(overId);
  return columnByCard ?? undefined;
}

/**
 * ドロップ先のカラムとover.idからソート順を計算する。
 */
function calculateSortOrder(
  targetColumn: Column,
  cardId: string,
  overId: string
): number {
  const targetCards = targetColumn.cards
    .filter((c) => c.id !== cardId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (overId === targetColumn.id) {
    // カラム自体にドロップ → 末尾に配置
    return targetCards.length;
  }

  // カードの上にドロップ → そのカードの位置に配置
  const overIndex = targetCards.findIndex((c) => c.id === overId);
  return overIndex >= 0 ? overIndex : targetCards.length;
}

export function BoardView() {
  const { board, participant, handleCardMoved, setBoard } = useBoardStore();
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumnColor, setActiveColumnColor] = useState('#000');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: DRAG_ACTIVATION_DISTANCE,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // エラーメッセージを一定時間後に自動で消す
  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), ERROR_DISPLAY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const findColumnByCardId = useCallback(
    (cardId: string) => {
      if (!board) return null;
      return board.columns.find((col) => col.cards.some((c) => c.id === cardId));
    },
    [board]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const cardId = String(event.active.id);
      const column = findColumnByCardId(cardId);
      if (column) {
        const card = column.cards.find((c) => c.id === cardId);
        if (card) {
          setActiveCard(card);
          setActiveColumnColor(column.color);
        }
      }
    },
    [findColumnByCardId]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over || !board || !participant) return;

      const cardId = String(active.id);
      const overId = String(over.id);
      const sourceColumn = findColumnByCardId(cardId);
      if (!sourceColumn) return;

      const targetColumn = findTargetColumn(board, overId, findColumnByCardId);
      if (!targetColumn) return;

      const newSortOrder = calculateSortOrder(targetColumn, cardId, overId);

      // 変更がない場合はスキップ
      if (sourceColumn.id === targetColumn.id) {
        const currentCard = sourceColumn.cards.find((c) => c.id === cardId);
        if (currentCard && currentCard.sortOrder === newSortOrder) return;
      }

      // 楽観的更新
      handleCardMoved({
        cardId,
        sourceColumnId: sourceColumn.id,
        targetColumnId: targetColumn.id,
        sortOrder: newSortOrder,
      });

      // API呼び出し
      try {
        await api.moveCard(board.slug, cardId, targetColumn.id, newSortOrder, participant.id);
      } catch {
        setErrorMessage('カードの移動に失敗しました。ボードを再読み込みします。');
        try {
          const refreshedBoard = await api.getBoard(board.slug);
          setBoard(refreshedBoard);
        } catch {
          // リフレッシュ失敗時は楽観的更新のまま
        }
      }
    },
    [board, participant, findColumnByCardId, handleCardMoved, setBoard]
  );

  if (!board) return null;

  const isDndEnabled =
    board.phase === 'WRITING' ||
    board.phase === 'DISCUSSION' ||
    board.phase === 'ACTION_ITEMS';

  const columnsContent = (
    <div className="flex gap-4 p-4 min-h-0 pb-20 lg:pb-4">
      {board.columns.map((column) => (
        <ColumnView key={column.id} column={column} />
      ))}
    </div>
  );

  return (
    <>
      {errorMessage && (
        <div
          role="alert"
          className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg"
        >
          {errorMessage}
        </div>
      )}
      {isDndEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {columnsContent}
          <DragOverlay>
            {activeCard ? (
              <CardItem card={activeCard} columnColor={activeColumnColor} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        columnsContent
      )}
    </>
  );
}
