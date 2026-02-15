package com.retra.board.usecase

import com.retra.TestFixtures
import com.retra.board.domain.ParticipantRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class UpdateOnlineStatusUseCaseTest {

    private val participantRepository: ParticipantRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: UpdateOnlineStatusUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = UpdateOnlineStatusUseCase(participantRepository, eventPublisher)
    }

    @Test
    fun `オンラインステータス更新`() {
        val board = TestFixtures.board(slug = "test1234")
        val participant = TestFixtures.participant(id = "p-1", board = board, isOnline = false)
        every { participantRepository.findById("p-1") } returns participant
        every { participantRepository.save(any()) } answers { firstArg() }

        useCase.execute("p-1", true, "session-1")

        assertTrue(participant.isOnline)
        assertEquals("session-1", participant.sessionId)
        verify { participantRepository.save(participant) }
    }

    @Test
    fun `存在しない参加者は何もしない`() {
        every { participantRepository.findById("unknown") } returns null

        useCase.execute("unknown", true)

        verify(exactly = 0) { participantRepository.save(any()) }
    }

    @Test
    fun `セッションID設定`() {
        val board = TestFixtures.board(slug = "test1234")
        val participant = TestFixtures.participant(id = "p-1", board = board)
        every { participantRepository.findById("p-1") } returns participant
        every { participantRepository.save(any()) } answers { firstArg() }

        useCase.setSessionId("p-1", "session-abc")

        assertEquals("session-abc", participant.sessionId)
        assertTrue(participant.isOnline)
        verify { eventPublisher.publishAll(any()) }
    }

    @Test
    fun `切断時のオフライン処理`() {
        val board = TestFixtures.board(slug = "test1234")
        val participant = TestFixtures.participant(id = "p-1", board = board, isOnline = true, sessionId = "session-1")
        every { participantRepository.findBySessionId("session-1") } returns participant
        every { participantRepository.save(any()) } answers { firstArg() }

        useCase.handleDisconnect("session-1")

        assertFalse(participant.isOnline)
        verify { participantRepository.save(participant) }
    }

    @Test
    fun `不明なセッションIDの切断は何もしない`() {
        every { participantRepository.findBySessionId("unknown-session") } returns null

        useCase.handleDisconnect("unknown-session")

        verify(exactly = 0) { participantRepository.save(any()) }
    }
}
