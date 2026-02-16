package com.retra.shared.gateway.websocket

import com.retra.actionitem.domain.ActionItemEvent
import com.retra.board.domain.BoardEvent
import com.retra.card.domain.CardEvent
import com.retra.card.domain.MemoEvent
import com.retra.card.domain.ReactionEvent
import com.retra.card.domain.VoteEvent
import com.retra.kudos.domain.KudosEvent
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionalEventListener

data class WebSocketMessage(
    val type: String,
    val payload: Any
)

@Component
class DomainEventBroadcaster(
    private val messagingTemplate: SimpMessagingTemplate
) {

    private fun buildCardPayload(cardId: String, columnId: String, content: String,
        authorNickname: String?, participantId: String?, voteCount: Int,
        sortOrder: Int, isAnonymous: Boolean, createdAt: String, updatedAt: String
    ) = mapOf(
        "id" to cardId, "columnId" to columnId, "content" to content,
        "authorNickname" to authorNickname, "participantId" to participantId,
        "voteCount" to voteCount, "sortOrder" to sortOrder,
        "isAnonymous" to isAnonymous, "createdAt" to createdAt, "updatedAt" to updatedAt
    )

    private fun buildMemoPayload(memoId: String, cardId: String, content: String,
        authorNickname: String?, participantId: String?, createdAt: String, updatedAt: String
    ) = mapOf(
        "id" to memoId, "cardId" to cardId, "content" to content,
        "authorNickname" to authorNickname, "participantId" to participantId,
        "createdAt" to createdAt, "updatedAt" to updatedAt
    )

    @TransactionalEventListener(fallbackExecution = true)
    fun handleCardCreated(event: CardEvent.CardCreated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/cards",
            WebSocketMessage("CARD_CREATED", buildCardPayload(
                cardId = event.cardId, columnId = event.columnId, content = event.content,
                authorNickname = if (event.isAnonymous) null else event.authorNickname,
                participantId = if (event.isAnonymous) null else event.participantId,
                voteCount = event.voteCount, sortOrder = event.sortOrder,
                isAnonymous = event.isAnonymous,
                createdAt = event.createdAt, updatedAt = event.updatedAt
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleCardUpdated(event: CardEvent.CardUpdated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/cards",
            WebSocketMessage("CARD_UPDATED", buildCardPayload(
                cardId = event.cardId, columnId = event.columnId, content = event.content,
                authorNickname = if (event.isAnonymous) null else event.authorNickname,
                participantId = if (event.isAnonymous) null else event.participantId,
                voteCount = event.voteCount, sortOrder = event.sortOrder,
                isAnonymous = event.isAnonymous,
                createdAt = event.createdAt, updatedAt = event.updatedAt
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleCardMoved(event: CardEvent.CardMoved) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/cards",
            WebSocketMessage("CARD_MOVED", mapOf(
                "cardId" to event.cardId,
                "sourceColumnId" to event.sourceColumnId,
                "targetColumnId" to event.targetColumnId,
                "sortOrder" to event.sortOrder
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleCardDiscussionMarked(event: CardEvent.CardDiscussionMarked) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/cards",
            WebSocketMessage("CARD_DISCUSSION_MARKED", mapOf(
                "cardId" to event.cardId,
                "isDiscussed" to event.isDiscussed,
                "discussionOrder" to event.discussionOrder
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleCardDeleted(event: CardEvent.CardDeleted) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/cards",
            WebSocketMessage("CARD_DELETED", mapOf(
                "cardId" to event.cardId,
                "columnId" to event.columnId
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleVoteAdded(event: VoteEvent.VoteAdded) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/votes",
            WebSocketMessage("VOTE_ADDED", mapOf(
                "id" to event.voteId,
                "cardId" to event.cardId,
                "participantId" to event.participantId,
                "createdAt" to event.createdAt
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleVoteRemoved(event: VoteEvent.VoteRemoved) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/votes",
            WebSocketMessage("VOTE_REMOVED", mapOf(
                "cardId" to event.cardId,
                "participantId" to event.participantId
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handlePhaseChanged(event: BoardEvent.PhaseChanged) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/phase",
            WebSocketMessage("PHASE_CHANGED", mapOf("phase" to event.phase))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleParticipantJoined(event: BoardEvent.ParticipantJoined) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/participants",
            WebSocketMessage("JOINED", mapOf(
                "id" to event.participantId,
                "nickname" to event.nickname,
                "isFacilitator" to event.isFacilitator,
                "isOnline" to true,
                "createdAt" to event.occurredAt.toString()
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleParticipantOnlineChanged(event: BoardEvent.ParticipantOnlineChanged) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/participants",
            WebSocketMessage(
                if (event.isOnline) "ONLINE" else "OFFLINE",
                mapOf("participantId" to event.participantId)
            )
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleMemoCreated(event: MemoEvent.MemoCreated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/memos",
            WebSocketMessage("MEMO_CREATED", buildMemoPayload(
                memoId = event.memoId, cardId = event.cardId, content = event.content,
                authorNickname = event.authorNickname, participantId = event.participantId,
                createdAt = event.createdAt, updatedAt = event.updatedAt
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleMemoUpdated(event: MemoEvent.MemoUpdated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/memos",
            WebSocketMessage("MEMO_UPDATED", buildMemoPayload(
                memoId = event.memoId, cardId = event.cardId, content = event.content,
                authorNickname = event.authorNickname, participantId = event.participantId,
                createdAt = event.createdAt, updatedAt = event.updatedAt
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleMemoDeleted(event: MemoEvent.MemoDeleted) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/memos",
            WebSocketMessage("MEMO_DELETED", mapOf(
                "cardId" to event.cardId,
                "memoId" to event.memoId
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleReactionAdded(event: ReactionEvent.ReactionAdded) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/reactions",
            WebSocketMessage("REACTION_ADDED", mapOf(
                "id" to event.reactionId,
                "cardId" to event.cardId,
                "participantId" to event.participantId,
                "emoji" to event.emoji,
                "createdAt" to event.createdAt
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleReactionRemoved(event: ReactionEvent.ReactionRemoved) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/reactions",
            WebSocketMessage("REACTION_REMOVED", mapOf(
                "cardId" to event.cardId,
                "participantId" to event.participantId,
                "emoji" to event.emoji
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleActionItemCreated(event: ActionItemEvent.ActionItemCreated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/action-items",
            WebSocketMessage("ACTION_ITEM_CREATED", mapOf(
                "actionItemId" to event.actionItemId,
                "boardId" to event.boardId
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleActionItemUpdated(event: ActionItemEvent.ActionItemUpdated) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/action-items",
            WebSocketMessage("ACTION_ITEM_UPDATED", mapOf(
                "actionItemId" to event.actionItemId
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleActionItemStatusChanged(event: ActionItemEvent.ActionItemStatusChanged) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/action-items",
            WebSocketMessage("ACTION_ITEM_STATUS_CHANGED", mapOf(
                "actionItemId" to event.actionItemId,
                "newStatus" to event.newStatus.name
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleActionItemDeleted(event: ActionItemEvent.ActionItemDeleted) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/action-items",
            WebSocketMessage("ACTION_ITEM_DELETED", mapOf(
                "actionItemId" to event.actionItemId
            ))
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleKudosSent(event: KudosEvent.KudosSent) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/kudos",
            WebSocketMessage(
                "KUDOS_SENT",
                mapOf(
                    "id" to event.kudosId,
                    "senderId" to event.senderId,
                    "senderNickname" to event.senderNickname,
                    "receiverId" to event.receiverId,
                    "receiverNickname" to event.receiverNickname,
                    "category" to event.category.name,
                    "message" to (event.message ?: ""),
                    "createdAt" to event.createdAt
                )
            )
        )
    }

    @TransactionalEventListener(fallbackExecution = true)
    fun handleKudosDeleted(event: KudosEvent.KudosDeleted) {
        messagingTemplate.convertAndSend(
            "/topic/board/${event.boardSlug}/kudos",
            WebSocketMessage(
                "KUDOS_DELETED",
                mapOf(
                    "id" to event.kudosId
                )
            )
        )
    }
}
