package com.retra.timer.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.messaging.simp.SimpMessagingTemplate
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class TimerServiceTest {

    private val boardRepository: BoardRepository = mockk()
    private val messagingTemplate: SimpMessagingTemplate = mockk(relaxed = true)
    private lateinit var service: TimerService

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        service = TimerService(boardRepository, messagingTemplate)
    }

    @Test
    fun `タイマー開始`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        val request = TimerRequest(TimerAction.START, 300, "p-1")
        val response = service.handleTimer("test1234", request)

        assertTrue(response.isRunning)
        assertEquals(300, response.remainingSeconds)
        assertEquals(300, response.totalSeconds)
    }

    @Test
    fun `タイマーリセット`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
        val response = service.handleTimer("test1234", TimerRequest(TimerAction.RESET, participantId = "p-1"))

        assertFalse(response.isRunning)
        assertEquals(0, response.remainingSeconds)
    }

    @Test
    fun `タイマー一時停止`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
        val response = service.handleTimer("test1234", TimerRequest(TimerAction.PAUSE, participantId = "p-1"))

        assertFalse(response.isRunning)
    }

    @Test
    fun `タイマー再開`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
        service.handleTimer("test1234", TimerRequest(TimerAction.PAUSE, participantId = "p-1"))
        val response = service.handleTimer("test1234", TimerRequest(TimerAction.RESUME, participantId = "p-1"))

        assertTrue(response.isRunning)
    }

    @Test
    fun `タイマー状態取得 - 未初期化`() {
        val response = service.getTimerState("unknown")

        assertFalse(response.isRunning)
        assertEquals(0, response.remainingSeconds)
    }

    @Test
    fun `非ファシリテーターで ForbiddenException`() {
        val board = TestFixtures.board()
        val member = TestFixtures.participant(id = "p-2", board = board, isFacilitator = false)
        board.participants.add(member)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<ForbiddenException> {
            service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-2"))
        }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            service.handleTimer("unknown", TimerRequest(TimerAction.START, 300, "p-1"))
        }
    }

    @Test
    fun `存在しない参加者で NotFoundException`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<NotFoundException> {
            service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "unknown-participant"))
        }
    }
}
