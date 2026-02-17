import { Client } from '@stomp/stompjs';
import { useCallback, useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import type {
  ActionItem,
  ActionItemDeletedPayload,
  ActionItemStatusChangedPayload,
  Card,
  CardDeletedPayload,
  CardDiscussionMarkedPayload,
  CardMovedPayload,
  Kudos,
  KudosDeletedPayload,
  Memo,
  MemoDeletedPayload,
  Participant,
  ParticipantOnlinePayload,
  Reaction,
  ReactionRemovedPayload,
  TimerState,
  Vote,
  VoteRemovedPayload,
  WebSocketMessage,
} from '../types';

export function useWebSocket(slug: string | undefined, participantId: string | undefined) {
  const clientRef = useRef<Client | null>(null);
  const {
    setConnected,
    setTimer,
    handleCardCreated,
    handleCardUpdated,
    handleCardDeleted,
    handleCardMoved,
    handleCardDiscussionMarked,
    handleVoteAdded,
    handleVoteRemoved,
    handlePhaseChanged,
    handleParticipantJoined,
    handleParticipantOnline,
    handleParticipantOffline,
    handleMemoCreated,
    handleMemoUpdated,
    handleMemoDeleted,
    handleReactionAdded,
    handleReactionRemoved,
    handleActionItemCreated,
    handleActionItemUpdated,
    handleActionItemStatusChanged,
    handleActionItemDeleted,
    handleKudosSent,
    handleKudosDeleted,
  } = useBoardStore();

  const connect = useCallback(() => {
    if (!slug || !participantId) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);

        // Register session
        client.publish({
          destination: `/app/board/${slug}/register`,
          body: JSON.stringify({ participantId }),
        });

        // Subscribe to card events
        client.subscribe(`/topic/board/${slug}/cards`, (message) => {
          const data: WebSocketMessage = JSON.parse(message.body);
          switch (data.type) {
            case 'CARD_CREATED': {
              const card = data.payload as Card & { isPrivateWriting?: boolean };
              if (card.isPrivateWriting && card.participantId !== participantId) {
                break;
              }
              handleCardCreated(card);
              break;
            }
            case 'CARD_UPDATED':
              handleCardUpdated(data.payload as Card);
              break;
            case 'CARD_DELETED':
              handleCardDeleted(data.payload as CardDeletedPayload);
              break;
            case 'CARD_MOVED':
              handleCardMoved(data.payload as CardMovedPayload);
              break;
            case 'CARD_DISCUSSION_MARKED':
              handleCardDiscussionMarked(data.payload as CardDiscussionMarkedPayload);
              break;
          }
        });

        // Subscribe to vote events
        client.subscribe(`/topic/board/${slug}/votes`, (message) => {
          const data: WebSocketMessage = JSON.parse(message.body);
          switch (data.type) {
            case 'VOTE_ADDED':
              handleVoteAdded(data.payload as Vote);
              break;
            case 'VOTE_REMOVED':
              handleVoteRemoved(data.payload as VoteRemovedPayload);
              break;
          }
        });

        // Subscribe to phase events
        client.subscribe(`/topic/board/${slug}/phase`, (message) => {
          const data: WebSocketMessage = JSON.parse(message.body);
          if (data.type === 'PHASE_CHANGED') {
            handlePhaseChanged((data.payload as { phase: string }).phase as never);
          }
        });

        // Subscribe to timer events
        client.subscribe(`/topic/board/${slug}/timer`, (message) => {
          const data: WebSocketMessage = JSON.parse(message.body);
          if (data.type === 'TIMER_UPDATE') {
            setTimer(data.payload as TimerState);
          }
        });

        // Subscribe to memo events
        client.subscribe(`/topic/board/${slug}/memos`, (message) => {
          const data: WebSocketMessage = JSON.parse(message.body);
          switch (data.type) {
            case 'MEMO_CREATED':
              handleMemoCreated(data.payload as Memo);
              break;
            case 'MEMO_UPDATED':
              handleMemoUpdated(data.payload as Memo);
              break;
            case 'MEMO_DELETED':
              handleMemoDeleted(data.payload as MemoDeletedPayload);
              break;
          }
        });

        // Subscribe to reaction events
        client.subscribe(`/topic/board/${slug}/reactions`, (message) => {
          const data: WebSocketMessage = JSON.parse(message.body);
          switch (data.type) {
            case 'REACTION_ADDED':
              handleReactionAdded(data.payload as Reaction);
              break;
            case 'REACTION_REMOVED':
              handleReactionRemoved(data.payload as ReactionRemovedPayload);
              break;
          }
        });

        // Subscribe to participant events
        client.subscribe(`/topic/board/${slug}/participants`, (message) => {
          const data: WebSocketMessage = JSON.parse(message.body);
          switch (data.type) {
            case 'JOINED':
              handleParticipantJoined(data.payload as Participant);
              break;
            case 'ONLINE':
              handleParticipantOnline(data.payload as ParticipantOnlinePayload);
              break;
            case 'OFFLINE':
              handleParticipantOffline(data.payload as ParticipantOnlinePayload);
              break;
          }
        });

        // Subscribe to action item events
        client.subscribe(`/topic/board/${slug}/action-items`, (message) => {
          const data: WebSocketMessage = JSON.parse(message.body);
          switch (data.type) {
            case 'ACTION_ITEM_CREATED':
              handleActionItemCreated(data.payload as ActionItem);
              break;
            case 'ACTION_ITEM_UPDATED':
              handleActionItemUpdated(data.payload as ActionItem);
              break;
            case 'ACTION_ITEM_STATUS_CHANGED':
              handleActionItemStatusChanged(data.payload as ActionItemStatusChangedPayload);
              break;
            case 'ACTION_ITEM_DELETED':
              handleActionItemDeleted(data.payload as ActionItemDeletedPayload);
              break;
          }
        });

        // Subscribe to kudos events
        client.subscribe(`/topic/board/${slug}/kudos`, (message) => {
          const data: WebSocketMessage = JSON.parse(message.body);
          switch (data.type) {
            case 'KUDOS_SENT':
              handleKudosSent(data.payload as Kudos);
              break;
            case 'KUDOS_DELETED':
              handleKudosDeleted(data.payload as KudosDeletedPayload);
              break;
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [
    slug,
    participantId,
    setConnected,
    setTimer,
    handleCardCreated,
    handleCardUpdated,
    handleCardDeleted,
    handleCardMoved,
    handleCardDiscussionMarked,
    handleVoteAdded,
    handleVoteRemoved,
    handlePhaseChanged,
    handleParticipantJoined,
    handleParticipantOnline,
    handleParticipantOffline,
    handleMemoCreated,
    handleMemoUpdated,
    handleMemoDeleted,
    handleReactionAdded,
    handleReactionRemoved,
    handleActionItemCreated,
    handleActionItemUpdated,
    handleActionItemStatusChanged,
    handleActionItemDeleted,
    handleKudosSent,
    handleKudosDeleted,
  ]);

  useEffect(() => {
    connect();
    return () => {
      clientRef.current?.deactivate();
    };
  }, [connect]);

  return clientRef;
}
