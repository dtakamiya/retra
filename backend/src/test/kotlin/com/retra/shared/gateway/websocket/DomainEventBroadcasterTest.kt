package com.retra.shared.gateway.websocket

import com.retra.actionitem.domain.ActionItemEvent
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardEvent
import com.retra.card.domain.CardEvent
import com.retra.card.domain.MemoEvent
import com.retra.card.domain.ReactionEvent
import com.retra.card.domain.VoteEvent
import com.retra.kudos.domain.KudosCategory
import com.retra.kudos.domain.KudosEvent
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.messaging.simp.SimpMessagingTemplate
import kotlin.test.assertEquals
import kotlin.test.assertNull

class DomainEventBroadcasterTest {

    private val messagingTemplate: SimpMessagingTemplate = mockk(relaxed = true)
    private val broadcaster = DomainEventBroadcaster(messagingTemplate)

    @Test
    fun `CardCreated イベントで cards トピックに送信`() {
        val event = CardEvent.CardCreated(
            boardSlug = "test1234", cardId = "c-1", columnId = "col-1",
            content = "Test", authorNickname = "Alice", participantId = "p-1",
            voteCount = 0, sortOrder = 0, isAnonymous = false,
            createdAt = "2024-01-01", updatedAt = "2024-01-01"
        )

        broadcaster.handleCardCreated(event)

        val msgSlot = slot<WebSocketMessage>()
        verify {
            messagingTemplate.convertAndSend(
                eq("/topic/board/test1234/cards"),
                capture(msgSlot)
            )
        }
        assertEquals("CARD_CREATED", msgSlot.captured.type)
        val payload = msgSlot.captured.payload as Map<*, *>
        assertEquals("Alice", payload["authorNickname"])
        assertEquals("p-1", payload["participantId"])
    }

    @Test
    fun `CardCreated 匿名モードではauthorNicknameとparticipantIdがnullになる`() {
        val event = CardEvent.CardCreated(
            boardSlug = "test1234", cardId = "c-1", columnId = "col-1",
            content = "Test", authorNickname = "Alice", participantId = "p-1",
            voteCount = 0, sortOrder = 0, isAnonymous = true,
            createdAt = "2024-01-01", updatedAt = "2024-01-01"
        )

        broadcaster.handleCardCreated(event)

        val msgSlot = slot<WebSocketMessage>()
        verify {
            messagingTemplate.convertAndSend(
                eq("/topic/board/test1234/cards"),
                capture(msgSlot)
            )
        }
        assertEquals("CARD_CREATED", msgSlot.captured.type)
        val payload = msgSlot.captured.payload as Map<*, *>
        assertNull(payload["authorNickname"])
        assertNull(payload["participantId"])
    }

    @Test
    fun `CardUpdated イベントで cards トピックに送信`() {
        val event = CardEvent.CardUpdated(
            boardSlug = "test1234", cardId = "c-1", columnId = "col-1",
            content = "Updated content", authorNickname = "Alice", participantId = "p-1",
            voteCount = 2, sortOrder = 1, isAnonymous = false,
            createdAt = "2024-01-01", updatedAt = "2024-01-02"
        )

        broadcaster.handleCardUpdated(event)

        val msgSlot = slot<WebSocketMessage>()
        verify {
            messagingTemplate.convertAndSend(
                eq("/topic/board/test1234/cards"),
                capture(msgSlot)
            )
        }
        assertEquals("CARD_UPDATED", msgSlot.captured.type)
        val payload = msgSlot.captured.payload as Map<*, *>
        assertEquals("Alice", payload["authorNickname"])
    }

    @Test
    fun `CardUpdated 匿名モードではauthorNicknameとparticipantIdがnullになる`() {
        val event = CardEvent.CardUpdated(
            boardSlug = "test1234", cardId = "c-1", columnId = "col-1",
            content = "Updated content", authorNickname = "Alice", participantId = "p-1",
            voteCount = 2, sortOrder = 1, isAnonymous = true,
            createdAt = "2024-01-01", updatedAt = "2024-01-02"
        )

        broadcaster.handleCardUpdated(event)

        val msgSlot = slot<WebSocketMessage>()
        verify {
            messagingTemplate.convertAndSend(
                eq("/topic/board/test1234/cards"),
                capture(msgSlot)
            )
        }
        assertEquals("CARD_UPDATED", msgSlot.captured.type)
        val payload = msgSlot.captured.payload as Map<*, *>
        assertNull(payload["authorNickname"])
        assertNull(payload["participantId"])
    }

    @Test
    fun `CardCreated プライベートモードでは CARD_CREATED_PRIVATE で最小限の情報のみ送信`() {
        val event = CardEvent.CardCreated(
            boardSlug = "test1234", cardId = "c-1", columnId = "col-1",
            content = "Secret content", authorNickname = "Alice", participantId = "p-1",
            voteCount = 0, sortOrder = 0, isAnonymous = false,
            isPrivateWriting = true,
            createdAt = "2024-01-01", updatedAt = "2024-01-01"
        )

        broadcaster.handleCardCreated(event)

        val msgSlot = slot<WebSocketMessage>()
        verify {
            messagingTemplate.convertAndSend(
                eq("/topic/board/test1234/cards"),
                capture(msgSlot)
            )
        }
        assertEquals("CARD_CREATED_PRIVATE", msgSlot.captured.type)
        val payload = msgSlot.captured.payload as Map<*, *>
        assertEquals("col-1", payload["columnId"])
        assertEquals("p-1", payload["participantId"])
        // content と authorNickname が含まれないことを確認
        assertNull(payload["content"])
        assertNull(payload["authorNickname"])
        assertNull(payload["cardId"])
    }

    @Test
    fun `CardUpdated プライベートモードでは CARD_UPDATED_PRIVATE で最小限の情報のみ送信`() {
        val event = CardEvent.CardUpdated(
            boardSlug = "test1234", cardId = "c-1", columnId = "col-1",
            content = "Secret updated content", authorNickname = "Alice", participantId = "p-1",
            voteCount = 2, sortOrder = 1, isAnonymous = false,
            isPrivateWriting = true,
            createdAt = "2024-01-01", updatedAt = "2024-01-02"
        )

        broadcaster.handleCardUpdated(event)

        val msgSlot = slot<WebSocketMessage>()
        verify {
            messagingTemplate.convertAndSend(
                eq("/topic/board/test1234/cards"),
                capture(msgSlot)
            )
        }
        assertEquals("CARD_UPDATED_PRIVATE", msgSlot.captured.type)
        val payload = msgSlot.captured.payload as Map<*, *>
        assertEquals("c-1", payload["cardId"])
        assertEquals("p-1", payload["participantId"])
        // content と authorNickname が含まれないことを確認
        assertNull(payload["content"])
        assertNull(payload["authorNickname"])
    }

    @Test
    fun `CardDeleted プライベートモードでは CARD_DELETED_PRIVATE で participantId も送信`() {
        val event = CardEvent.CardDeleted(
            boardSlug = "test1234", cardId = "c-1", columnId = "col-1",
            isPrivateWriting = true, participantId = "p-1"
        )

        broadcaster.handleCardDeleted(event)

        val msgSlot = slot<WebSocketMessage>()
        verify {
            messagingTemplate.convertAndSend(
                eq("/topic/board/test1234/cards"),
                capture(msgSlot)
            )
        }
        assertEquals("CARD_DELETED_PRIVATE", msgSlot.captured.type)
        val payload = msgSlot.captured.payload as Map<*, *>
        assertEquals("c-1", payload["cardId"])
        assertEquals("col-1", payload["columnId"])
        assertEquals("p-1", payload["participantId"])
    }

    @Test
    fun `CardMoved イベントで cards トピックに送信`() {
        val event = CardEvent.CardMoved(
            boardSlug = "test1234", cardId = "c-1",
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
        val event = CardEvent.CardDeleted(boardSlug = "test1234", cardId = "c-1", columnId = "col-1")

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
        val event = VoteEvent.VoteAdded(boardSlug = "test1234", voteId = "v-1", cardId = "c-1", participantId = "p-1", createdAt = "2024-01-01")

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
        val event = VoteEvent.VoteRemoved(boardSlug = "test1234", cardId = "c-1", participantId = "p-1")

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
        val event = BoardEvent.PhaseChanged(boardSlug = "test1234", phase = com.retra.board.domain.Phase.VOTING)

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
        val event = BoardEvent.ParticipantJoined(boardSlug = "test1234", participantId = "p-1", nickname = "Alice", isFacilitator = true)

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
        val onlineEvent = BoardEvent.ParticipantOnlineChanged(boardSlug = "test1234", participantId = "p-1", isOnline = true)
        val offlineEvent = BoardEvent.ParticipantOnlineChanged(boardSlug = "test1234", participantId = "p-1", isOnline = false)

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
            boardSlug = "test1234", cardId = "c-1", memoId = "m-1",
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
            boardSlug = "test1234", cardId = "c-1", memoId = "m-1",
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
        val event = MemoEvent.MemoDeleted(boardSlug = "test1234", cardId = "c-1", memoId = "m-1")

        broadcaster.handleMemoDeleted(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/memos",
                match<WebSocketMessage> { it.type == "MEMO_DELETED" }
            )
        }
    }

    @Test
    fun `ReactionAdded イベントで reactions トピックに送信`() {
        val event = ReactionEvent.ReactionAdded(boardSlug = "test1234", reactionId = "r-1", cardId = "c-1", participantId = "p-1", emoji = "👍", createdAt = "2024-01-01")

        broadcaster.handleReactionAdded(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/reactions",
                match<WebSocketMessage> { it.type == "REACTION_ADDED" }
            )
        }
    }

    @Test
    fun `ReactionRemoved イベントで reactions トピックに送信`() {
        val event = ReactionEvent.ReactionRemoved(boardSlug = "test1234", cardId = "c-1", participantId = "p-1", emoji = "👍")

        broadcaster.handleReactionRemoved(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/reactions",
                match<WebSocketMessage> { it.type == "REACTION_REMOVED" }
            )
        }
    }

    @Test
    fun `ActionItemCreated イベントで action-items トピックに送信`() {
        val event = ActionItemEvent.ActionItemCreated("ai-1", "test1234", "board-1")

        broadcaster.handleActionItemCreated(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/action-items",
                match<WebSocketMessage> { it.type == "ACTION_ITEM_CREATED" }
            )
        }
    }

    @Test
    fun `ActionItemUpdated イベントで action-items トピックに送信`() {
        val event = ActionItemEvent.ActionItemUpdated("ai-1", "test1234")

        broadcaster.handleActionItemUpdated(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/action-items",
                match<WebSocketMessage> { it.type == "ACTION_ITEM_UPDATED" }
            )
        }
    }

    @Test
    fun `ActionItemStatusChanged イベントで action-items トピックに送信`() {
        val event = ActionItemEvent.ActionItemStatusChanged("ai-1", "test1234", ActionItemStatus.IN_PROGRESS)

        broadcaster.handleActionItemStatusChanged(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/action-items",
                match<WebSocketMessage> { it.type == "ACTION_ITEM_STATUS_CHANGED" }
            )
        }
    }

    @Test
    fun `ActionItemDeleted イベントで action-items トピックに送信`() {
        val event = ActionItemEvent.ActionItemDeleted("ai-1", "test1234")

        broadcaster.handleActionItemDeleted(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/action-items",
                match<WebSocketMessage> { it.type == "ACTION_ITEM_DELETED" }
            )
        }
    }

    @Test
    fun `handleKudosSent sends KUDOS_SENT`() {
        val event = KudosEvent.KudosSent(
            boardSlug = "test-slug",
            kudosId = "k-1",
            senderId = "s-1",
            senderNickname = "Alice",
            receiverId = "r-1",
            receiverNickname = "Bob",
            category = KudosCategory.GREAT_JOB,
            message = "Great work!",
            createdAt = "2024-01-01T00:00:00Z"
        )

        broadcaster.handleKudosSent(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test-slug/kudos",
                match<WebSocketMessage> { it.type == "KUDOS_SENT" }
            )
        }
    }

    @Test
    fun `handleKudosDeleted sends KUDOS_DELETED`() {
        val event = KudosEvent.KudosDeleted(
            boardSlug = "test-slug",
            kudosId = "k-1"
        )

        broadcaster.handleKudosDeleted(event)

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test-slug/kudos",
                match<WebSocketMessage> { it.type == "KUDOS_DELETED" }
            )
        }
    }
}
