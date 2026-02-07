import { Client } from '@stomp/stompjs';
import { useCallback, useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import type {
  Card,
  CardDeletedPayload,
  CardMovedPayload,
  Participant,
  ParticipantOnlinePayload,
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
    handleVoteAdded,
    handleVoteRemoved,
    handlePhaseChanged,
    handleParticipantJoined,
    handleParticipantOnline,
    handleParticipantOffline,
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
            case 'CARD_CREATED':
              handleCardCreated(data.payload as Card);
              break;
            case 'CARD_UPDATED':
              handleCardUpdated(data.payload as Card);
              break;
            case 'CARD_DELETED':
              handleCardDeleted(data.payload as CardDeletedPayload);
              break;
            case 'CARD_MOVED':
              handleCardMoved(data.payload as CardMovedPayload);
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
    handleVoteAdded,
    handleVoteRemoved,
    handlePhaseChanged,
    handleParticipantJoined,
    handleParticipantOnline,
    handleParticipantOffline,
  ]);

  useEffect(() => {
    connect();
    return () => {
      clientRef.current?.deactivate();
    };
  }, [connect]);

  return clientRef;
}
