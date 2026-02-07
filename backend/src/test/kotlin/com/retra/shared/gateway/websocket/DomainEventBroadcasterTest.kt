package com.retra.shared.gateway.websocket

import com.retra.board.domain.BoardEvent
import com.retra.card.domain.CardEvent
import com.retra.card.domain.MemoEvent
import com.retra.card.domain.VoteEvent
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.messaging.simp.SimpMessagingTemplate

class DomainEventBroadcasterTest {

    private val messagingTemplate: SimpMessagingTemplate = mockk(relaxed = true)
    private val broadcaster = DomainEventBroadcaster(messagingTemplate)

    @Test
    fun `CardCreated イベントで cards トピックに送信`() {
        val event = CardEvent.CardCreated(
            slug = "test1234", cardId = "c-1", columnId = "col-1",
            content = "Test", authorNickname = "Alice", participantId = "p-1",
            voteCount = 0, sortOrder = 0, createdAt = "2024-01-01", updatedAt = "2024-01-01"
        )

        broadcaster.handleCardCreated(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/cards",
                match<WebSocketMessage> { it.type == "CARD_CREATED" }
            )
        }
    }

    @Test
    fun `CardUpdated イベントで cards トピックに送信`() {
        val event = CardEvent.CardUpdated(
            slug = "test1234", cardId = "c-1", columnId = "col-1",
            content = "Updated content", authorNickname = "Alice", participantId = "p-1",
            voteCount = 2, sortOrder = 1, createdAt = "2024-01-01", updatedAt = "2024-01-02"
        )

        broadcaster.handleCardUpdated(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/cards",
                match<WebSocketMessage> { it.type == "CARD_UPDATED" }
            )
        }
    }

    @Test
    fun `CardMoved イベントで cards トピックに送信`() {
        val event = CardEvent.CardMoved(
            slug = "test1234", cardId = "c-1",
            sourceColumnId = "col-1", targetColumnId = "col-2", sortOrder = 0
        )

        broadcaster.handleCardMoved(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/cards",
                match<WebSocketMessage> { it.type == "CARD_MOVED" }
            )
        }
    }

    @Test
    fun `CardDeleted イベントで cards トピックに送信`() {
        val event = CardEvent.CardDeleted("test1234", "c-1", "col-1")

        broadcaster.handleCardDeleted(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/cards",
                match<WebSocketMessage> { it.type == "CARD_DELETED" }
            )
        }
    }

    @Test
    fun `VoteAdded イベントで votes トピックに送信`() {
        val event = VoteEvent.VoteAdded("test1234", "v-1", "c-1", "p-1", "2024-01-01")

        broadcaster.handleVoteAdded(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/votes",
                match<WebSocketMessage> { it.type == "VOTE_ADDED" }
            )
        }
    }

    @Test
    fun `VoteRemoved イベントで votes トピックに送信`() {
        val event = VoteEvent.VoteRemoved("test1234", "c-1", "p-1")

        broadcaster.handleVoteRemoved(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/votes",
                match<WebSocketMessage> { it.type == "VOTE_REMOVED" }
            )
        }
    }

    @Test
    fun `PhaseChanged イベントで phase トピックに送信`() {
        val event = BoardEvent.PhaseChanged("test1234", com.retra.board.domain.Phase.VOTING)

        broadcaster.handlePhaseChanged(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/phase",
                match<WebSocketMessage> { it.type == "PHASE_CHANGED" }
            )
        }
    }

    @Test
    fun `ParticipantJoined イベントで participants トピックに送信`() {
        val event = BoardEvent.ParticipantJoined("test1234", "p-1", "Alice", true)

        broadcaster.handleParticipantJoined(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/participants",
                match<WebSocketMessage> { it.type == "JOINED" }
            )
        }
    }

    @Test
    fun `ParticipantOnlineChanged イベントで ONLINE OFFLINE 送信`() {
        val onlineEvent = BoardEvent.ParticipantOnlineChanged("test1234", "p-1", true)
        val offlineEvent = BoardEvent.ParticipantOnlineChanged("test1234", "p-1", false)

        broadcaster.handleParticipantOnlineChanged(onlineEvent)
        broadcaster.handleParticipantOnlineChanged(offlineEvent)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/participants",
                match<WebSocketMessage> { it.type == "ONLINE" }
            )
        }
        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/participants",
                match<WebSocketMessage> { it.type == "OFFLINE" }
            )
        }
    }

    @Test
    fun `MemoCreated イベントで memos トピックに送信`() {
        val event = MemoEvent.MemoCreated(
            slug = "test1234", cardId = "c-1", memoId = "m-1",
            content = "Test memo", authorNickname = "Alice", participantId = "p-1",
            createdAt = "2024-01-01", updatedAt = "2024-01-01"
        )

        broadcaster.handleMemoCreated(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/memos",
                match<WebSocketMessage> { it.type == "MEMO_CREATED" }
            )
        }
    }

    @Test
    fun `MemoUpdated イベントで memos トピックに送信`() {
        val event = MemoEvent.MemoUpdated(
            slug = "test1234", cardId = "c-1", memoId = "m-1",
            content = "Updated memo", authorNickname = "Alice", participantId = "p-1",
            createdAt = "2024-01-01", updatedAt = "2024-01-01"
        )

        broadcaster.handleMemoUpdated(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/memos",
                match<WebSocketMessage> { it.type == "MEMO_UPDATED" }
            )
        }
    }

    @Test
    fun `MemoDeleted イベントで memos トピックに送信`() {
        val event = MemoEvent.MemoDeleted("test1234", "c-1", "m-1")

        broadcaster.handleMemoDeleted(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/memos",
                match<WebSocketMessage> { it.type == "MEMO_DELETED" }
            )
        }
    }
}
