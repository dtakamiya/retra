package com.retra.shared.gateway.websocket

import com.retra.board.domain.BoardEvent
import com.retra.card.domain.CardEvent
import com.retra.card.domain.MemoEvent
import com.retra.card.domain.VoteEvent
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

data class WebSocketMessage(
    val type: String,
    val payload: Any
)

@Component
class DomainEventBroadcaster(
    private val messagingTemplate: SimpMessagingTemplate
) {

    @EventListener
    fun handleCardCreated(event: CardEvent.CardCreated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/cards",
            WebSocketMessage("CARD_CREATED", mapOf(
                "id" to event.cardId,
                "columnId" to event.columnId,
                "content" to event.content,
                "authorNickname" to event.authorNickname,
                "participantId" to event.participantId,
                "voteCount" to event.voteCount,
                "sortOrder" to event.sortOrder,
                "createdAt" to event.createdAt,
                "updatedAt" to event.updatedAt
            ))
        )
    }

    @EventListener
    fun handleCardUpdated(event: CardEvent.CardUpdated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/cards",
            WebSocketMessage("CARD_UPDATED", mapOf(
                "id" to event.cardId,
                "columnId" to event.columnId,
                "content" to event.content,
                "authorNickname" to event.authorNickname,
                "participantId" to event.participantId,
                "voteCount" to event.voteCount,
                "sortOrder" to event.sortOrder,
                "createdAt" to event.createdAt,
                "updatedAt" to event.updatedAt
            ))
        )
    }

    @EventListener
    fun handleCardMoved(event: CardEvent.CardMoved) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/cards",
            WebSocketMessage("CARD_MOVED", mapOf(
                "cardId" to event.cardId,
                "sourceColumnId" to event.sourceColumnId,
                "targetColumnId" to event.targetColumnId,
                "sortOrder" to event.sortOrder
            ))
        )
    }

    @EventListener
    fun handleCardDeleted(event: CardEvent.CardDeleted) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/cards",
            WebSocketMessage("CARD_DELETED", mapOf(
                "cardId" to event.cardId,
                "columnId" to event.columnId
            ))
        )
    }

    @EventListener
    fun handleVoteAdded(event: VoteEvent.VoteAdded) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/votes",
            WebSocketMessage("VOTE_ADDED", mapOf(
                "id" to event.voteId,
                "cardId" to event.cardId,
                "participantId" to event.participantId,
                "createdAt" to event.createdAt
            ))
        )
    }

    @EventListener
    fun handleVoteRemoved(event: VoteEvent.VoteRemoved) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/votes",
            WebSocketMessage("VOTE_REMOVED", mapOf(
                "cardId" to event.cardId,
                "participantId" to event.participantId
            ))
        )
    }

    @EventListener
    fun handlePhaseChanged(event: BoardEvent.PhaseChanged) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/phase",
            WebSocketMessage("PHASE_CHANGED", mapOf("phase" to event.phase))
        )
    }

    @EventListener
    fun handleParticipantJoined(event: BoardEvent.ParticipantJoined) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/participants",
            WebSocketMessage("JOINED", mapOf(
                "id" to event.participantId,
                "nickname" to event.nickname,
                "isFacilitator" to event.isFacilitator,
                "isOnline" to true,
                "createdAt" to event.occurredAt.toString()
            ))
        )
    }

    @EventListener
    fun handleParticipantOnlineChanged(event: BoardEvent.ParticipantOnlineChanged) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/participants",
            WebSocketMessage(
                if (event.isOnline) "ONLINE" else "OFFLINE",
                mapOf("participantId" to event.participantId)
            )
        )
    }

    @EventListener
    fun handleMemoCreated(event: MemoEvent.MemoCreated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/memos",
            WebSocketMessage("MEMO_CREATED", mapOf(
                "id" to event.memoId,
                "cardId" to event.cardId,
                "content" to event.content,
                "authorNickname" to event.authorNickname,
                "participantId" to event.participantId,
                "createdAt" to event.createdAt,
                "updatedAt" to event.updatedAt
            ))
        )
    }

    @EventListener
    fun handleMemoUpdated(event: MemoEvent.MemoUpdated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/memos",
            WebSocketMessage("MEMO_UPDATED", mapOf(
                "id" to event.memoId,
                "cardId" to event.cardId,
                "content" to event.content,
                "authorNickname" to event.authorNickname,
                "participantId" to event.participantId,
                "createdAt" to event.createdAt,
                "updatedAt" to event.updatedAt
            ))
        )
    }

    @EventListener
    fun handleMemoDeleted(event: MemoEvent.MemoDeleted) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/memos",
            WebSocketMessage("MEMO_DELETED", mapOf(
                "cardId" to event.cardId,
                "memoId" to event.memoId
            ))
        )
    }
}
