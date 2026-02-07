package com.retra.service

import com.retra.TestFixtures
import com.retra.domain.repository.ParticipantRepository
import com.retra.dto.JoinBoardRequest
import com.retra.exception.NotFoundException
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.util.Optional
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ParticipantServiceTest {

    private val participantRepository: ParticipantRepository = mockk()
    private val boardService: BoardService = mockk()
    private val eventPublisher: ApplicationEventPublisher = mockk(relaxed = true)

    private lateinit var participantService: ParticipantService

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        participantService = ParticipantService(participantRepository, boardService, eventPublisher)
    }

    @Nested
    inner class JoinBoard {

        @Test
        fun `最初の参加者はファシリテーターになる`() {
            val board = TestFixtures.board()
            every { boardService.findBoardBySlug(any()) } returns board
            every { participantRepository.save(any()) } answers { firstArg() }

            val response = participantService.joinBoard("test1234", JoinBoardRequest("Alice"))

            assertTrue(response.isFacilitator)
            assertEquals("Alice", response.nickname)
            verify { eventPublisher.publishEvent(any<ParticipantJoinedEvent>()) }
        }

        @Test
        fun `2人目以降の参加者は非ファシリテーター`() {
            val board = TestFixtures.board()
            val existing = TestFixtures.participant(board = board, isFacilitator = true)
            board.participants.add(existing)
            every { boardService.findBoardBySlug(any()) } returns board
            every { participantRepository.save(any()) } answers { firstArg() }

            val response = participantService.joinBoard("test1234", JoinBoardRequest("Bob"))

            assertFalse(response.isFacilitator)
            assertEquals("Bob", response.nickname)
        }

        @Test
        fun `参加者はオンライン状態で参加`() {
            val board = TestFixtures.board()
            every { boardService.findBoardBySlug(any()) } returns board
            every { participantRepository.save(any()) } answers { firstArg() }

            val response = participantService.joinBoard("test1234", JoinBoardRequest("Charlie"))

            assertTrue(response.isOnline)
        }
    }

    @Nested
    inner class UpdateOnlineStatus {

        @Test
        fun `オンラインステータスをtrueに更新`() {
            val board = TestFixtures.board(slug = "test1234")
            val participant = TestFixtures.participant(id = "p-1", board = board, isOnline = false)
            every { participantRepository.findById("p-1") } returns Optional.of(participant)
            every { participantRepository.save(any()) } answers { firstArg() }

            participantService.updateOnlineStatus("p-1", true, "session-1")

            assertTrue(participant.isOnline)
            assertEquals("session-1", participant.sessionId)
            verify { eventPublisher.publishEvent(any<ParticipantOnlineEvent>()) }
        }

        @Test
        fun `sessionIdがnullの場合はsessionIdを更新しない`() {
            val board = TestFixtures.board(slug = "test1234")
            val participant = TestFixtures.participant(id = "p-1", board = board, sessionId = "old-session")
            every { participantRepository.findById("p-1") } returns Optional.of(participant)
            every { participantRepository.save(any()) } answers { firstArg() }

            participantService.updateOnlineStatus("p-1", false, null)

            assertEquals("old-session", participant.sessionId)
        }

        @Test
        fun `存在しない参加者は無視される`() {
            every { participantRepository.findById("unknown") } returns Optional.empty()

            participantService.updateOnlineStatus("unknown", true, null)

            verify(exactly = 0) { participantRepository.save(any()) }
            verify(exactly = 0) { eventPublisher.publishEvent(any()) }
        }

        @Test
        fun `boardがnullの場合イベント発行されない`() {
            val participant = TestFixtures.participant(id = "p-1", board = null)
            every { participantRepository.findById("p-1") } returns Optional.of(participant)
            every { participantRepository.save(any()) } answers { firstArg() }

            participantService.updateOnlineStatus("p-1", true, null)

            verify(exactly = 0) { eventPublisher.publishEvent(any()) }
        }
    }

    @Nested
    inner class SetSessionId {

        @Test
        fun `セッションID設定成功`() {
            val participant = TestFixtures.participant(id = "p-1", isOnline = false)
            every { participantRepository.findById("p-1") } returns Optional.of(participant)
            every { participantRepository.save(any()) } answers { firstArg() }

            participantService.setSessionId("p-1", "session-123")

            assertEquals("session-123", participant.sessionId)
            assertTrue(participant.isOnline)
        }

        @Test
        fun `存在しない参加者でNotFoundException`() {
            every { participantRepository.findById("unknown") } returns Optional.empty()

            assertFailsWith<NotFoundException> {
                participantService.setSessionId("unknown", "session-123")
            }
        }
    }

    @Nested
    inner class HandleDisconnect {

        @Test
        fun `セッション切断で参加者がオフラインになる`() {
            val board = TestFixtures.board(slug = "test1234")
            val participant = TestFixtures.participant(id = "p-1", board = board, isOnline = true, sessionId = "session-1")
            every { participantRepository.findBySessionId("session-1") } returns participant
            every { participantRepository.save(any()) } answers { firstArg() }

            participantService.handleDisconnect("session-1")

            assertFalse(participant.isOnline)
            verify { eventPublisher.publishEvent(match<ParticipantOnlineEvent> { !it.isOnline }) }
        }

        @Test
        fun `不明セッションIDでは何もしない`() {
            every { participantRepository.findBySessionId("unknown") } returns null

            participantService.handleDisconnect("unknown")

            verify(exactly = 0) { participantRepository.save(any()) }
        }

        @Test
        fun `boardがnullの場合イベント発行されない`() {
            val participant = TestFixtures.participant(id = "p-1", board = null, sessionId = "session-1")
            every { participantRepository.findBySessionId("session-1") } returns participant
            every { participantRepository.save(any()) } answers { firstArg() }

            participantService.handleDisconnect("session-1")

            verify(exactly = 0) { eventPublisher.publishEvent(any()) }
        }
    }
}
