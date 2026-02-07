package com.retra.websocket

import com.retra.service.*
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

data class WebSocketMessage(
    val type: String,
    val payload: Any
)

@Component
class BoardEventBroadcaster(
    private val messagingTemplate: SimpMessagingTemplate
) {

    @EventListener
    fun handleCardCreated(event: CardCreatedEvent) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/cards",
            WebSocketMessage("CARD_CREATED", event.card)
        )
    }

    @EventListener
    fun handleCardUpdated(event: CardUpdatedEvent) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/cards",
            WebSocketMessage("CARD_UPDATED", event.card)
        )
    }

    @EventListener
    fun handleCardMoved(event: CardMovedEvent) {
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
    fun handleCardDeleted(event: CardDeletedEvent) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/cards",
            WebSocketMessage("CARD_DELETED", mapOf("cardId" to event.cardId, "columnId" to event.columnId))
        )
    }

    @EventListener
    fun handleVoteAdded(event: VoteAddedEvent) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/votes",
            WebSocketMessage("VOTE_ADDED", event.vote)
        )
    }

    @EventListener
    fun handleVoteRemoved(event: VoteRemovedEvent) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/votes",
            WebSocketMessage("VOTE_REMOVED", mapOf("cardId" to event.cardId, "participantId" to event.participantId))
        )
    }

    @EventListener
    fun handlePhaseChanged(event: PhaseChangedEvent) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/phase",
            WebSocketMessage("PHASE_CHANGED", mapOf("phase" to event.phase))
        )
    }

    @EventListener
    fun handleParticipantJoined(event: ParticipantJoinedEvent) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/participants",
            WebSocketMessage("JOINED", event.participant)
        )
    }

    @EventListener
    fun handleParticipantOnline(event: ParticipantOnlineEvent) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.slug}/participants",
            WebSocketMessage(
                if (event.isOnline) "ONLINE" else "OFFLINE",
                mapOf("participantId" to event.participantId)
            )
        )
    }
}
