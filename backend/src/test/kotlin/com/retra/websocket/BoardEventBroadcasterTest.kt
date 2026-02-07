package com.retra.websocket

import com.retra.domain.model.Phase
import com.retra.dto.CardResponse
import com.retra.dto.ParticipantResponse
import com.retra.dto.VoteResponse
import com.retra.service.*
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.messaging.simp.SimpMessagingTemplate
import kotlin.test.assertEquals

class BoardEventBroadcasterTest {

    private val messagingTemplate: SimpMessagingTemplate = mockk(relaxed = true)
    private lateinit var broadcaster: BoardEventBroadcaster

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        broadcaster = BoardEventBroadcaster(messagingTemplate)
    }

    private val sampleCard = CardResponse("card-1", "col-1", "Test", "Alice", "p-1", 0, 0, "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z")
    private val sampleVote = VoteResponse("vote-1", "card-1", "p-1", "2024-01-01T00:00:00Z")
    private val sampleParticipant = ParticipantResponse("p-1", "Alice", true, true, "2024-01-01T00:00:00Z")

    @Test
    fun `CardCreatedEvent を cards トピックにブロードキャスト`() {
        broadcaster.handleCardCreated(CardCreatedEvent("test1234", sampleCard))

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/cards",
                match<WebSocketMessage> { it.type == "CARD_CREATED" }
            )
        }
    }

    @Test
    fun `CardUpdatedEvent を cards トピックにブロードキャスト`() {
        broadcaster.handleCardUpdated(CardUpdatedEvent("test1234", sampleCard))

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/cards",
                match<WebSocketMessage> { it.type == "CARD_UPDATED" }
            )
        }
    }

    @Test
    fun `CardDeletedEvent を cards トピックにブロードキャスト`() {
        broadcaster.handleCardDeleted(CardDeletedEvent("test1234", "card-1", "col-1"))

        val slot = slot<WebSocketMessage>()
        verify { messagingTemplate.convertAndSend("/topic/board/test1234/cards", capture(slot)) }
        assertEquals("CARD_DELETED", slot.captured.type)
        @Suppress("UNCHECKED_CAST")
        val payload = slot.captured.payload as Map<String, String>
        assertEquals("card-1", payload["cardId"])
        assertEquals("col-1", payload["columnId"])
    }

    @Test
    fun `VoteAddedEvent を votes トピックにブロードキャスト`() {
        broadcaster.handleVoteAdded(VoteAddedEvent("test1234", sampleVote))

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/votes",
                match<WebSocketMessage> { it.type == "VOTE_ADDED" }
            )
        }
    }

    @Test
    fun `VoteRemovedEvent を votes トピックにブロードキャスト`() {
        broadcaster.handleVoteRemoved(VoteRemovedEvent("test1234", "card-1", "p-1"))

        val slot = slot<WebSocketMessage>()
        verify { messagingTemplate.convertAndSend("/topic/board/test1234/votes", capture(slot)) }
        assertEquals("VOTE_REMOVED", slot.captured.type)
    }

    @Test
    fun `PhaseChangedEvent を phase トピックにブロードキャスト`() {
        broadcaster.handlePhaseChanged(PhaseChangedEvent("test1234", Phase.VOTING))

        val slot = slot<WebSocketMessage>()
        verify { messagingTemplate.convertAndSend("/topic/board/test1234/phase", capture(slot)) }
        assertEquals("PHASE_CHANGED", slot.captured.type)
    }

    @Test
    fun `ParticipantJoinedEvent を participants トピックにブロードキャスト`() {
        broadcaster.handleParticipantJoined(ParticipantJoinedEvent("test1234", sampleParticipant))

        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/participants",
                match<WebSocketMessage> { it.type == "JOINED" }
            )
        }
    }

    @Test
    fun `CardMovedEvent を cards トピックにブロードキャスト`() {
        broadcaster.handleCardMoved(CardMovedEvent("test1234", "card-1", "col-1", "col-2", 0))

        val slot = slot<WebSocketMessage>()
        verify { messagingTemplate.convertAndSend("/topic/board/test1234/cards", capture(slot)) }
        assertEquals("CARD_MOVED", slot.captured.type)
        @Suppress("UNCHECKED_CAST")
        val payload = slot.captured.payload as Map<String, Any>
        assertEquals("card-1", payload["cardId"])
        assertEquals("col-1", payload["sourceColumnId"])
        assertEquals("col-2", payload["targetColumnId"])
        assertEquals(0, payload["sortOrder"])
    }

    @Test
    fun `ParticipantOnlineEvent のオンライン・オフライン切替`() {
        broadcaster.handleParticipantOnline(ParticipantOnlineEvent("test1234", "p-1", true))
        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/participants",
                match<WebSocketMessage> { it.type == "ONLINE" }
            )
        }

        broadcaster.handleParticipantOnline(ParticipantOnlineEvent("test1234", "p-1", false))
        verify {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/participants",
                match<WebSocketMessage> { it.type == "OFFLINE" }
            )
        }
    }
}
