package com.retra.timer.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import io.mockk.*
import org.junit.jupiter.api.AfterEach
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

    @AfterEach
    fun tearDown() {
        service.shutdown()
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
    fun `タイマー開始 - durationなしでデフォルト値300秒`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        val request = TimerRequest(TimerAction.START, null, "p-1")
        val response = service.handleTimer("test1234", request)

        assertTrue(response.isRunning)
        assertEquals(300, response.remainingSeconds)
        assertEquals(300, response.totalSeconds)
    }

    @Test
    fun `タイマー開始 - duration 0で BadRequestException`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            service.handleTimer("test1234", TimerRequest(TimerAction.START, 0, "p-1"))
        }
    }

    @Test
    fun `タイマー開始 - durationが上限超過で BadRequestException`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            service.handleTimer("test1234", TimerRequest(TimerAction.START, 3601, "p-1"))
        }
    }

    @Test
    fun `タイマー開始 - 負の duration で BadRequestException`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            service.handleTimer("test1234", TimerRequest(TimerAction.START, -1, "p-1"))
        }
    }

    @Test
    fun `タイマー開始 - duration 1秒（最小有効値）で成功`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        val response = service.handleTimer("test1234", TimerRequest(TimerAction.START, 1, "p-1"))

        assertTrue(response.isRunning)
        assertEquals(1, response.remainingSeconds)
        assertEquals(1, response.totalSeconds)
    }

    @Test
    fun `タイマー開始 - duration 3600秒（最大有効値）で成功`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        val response = service.handleTimer("test1234", TimerRequest(TimerAction.START, 3600, "p-1"))

        assertTrue(response.isRunning)
        assertEquals(3600, response.remainingSeconds)
        assertEquals(3600, response.totalSeconds)
    }

    @Test
    fun `タイマー再開始で既存ブロードキャストが停止されて新しいものが開始される`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
        val response = service.handleTimer("test1234", TimerRequest(TimerAction.START, 120, "p-1"))

        assertTrue(response.isRunning)
        assertEquals(120, response.remainingSeconds)
        assertEquals(120, response.totalSeconds)
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
        assertEquals(0, response.totalSeconds)
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
    fun `タイマー再開 - remainingSecondsが0の場合は再開されない`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
        service.handleTimer("test1234", TimerRequest(TimerAction.RESET, participantId = "p-1"))
        val response = service.handleTimer("test1234", TimerRequest(TimerAction.RESUME, participantId = "p-1"))

        assertFalse(response.isRunning)
        assertEquals(0, response.remainingSeconds)
    }

    @Test
    fun `タイマー状態取得 - 未初期化`() {
        val response = service.getTimerState("unknown")

        assertFalse(response.isRunning)
        assertEquals(0, response.remainingSeconds)
        assertEquals(0, response.totalSeconds)
    }

    @Test
    fun `タイマー状態取得 - 初期化済み`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        service.handleTimer("test1234", TimerRequest(TimerAction.START, 120, "p-1"))

        val response = service.getTimerState("test1234")

        assertTrue(response.isRunning)
        assertEquals(120, response.remainingSeconds)
        assertEquals(120, response.totalSeconds)
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

    @Test
    fun `shutdown でスケジューラが正常に停止される`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
        service.shutdown()
    }

    @Test
    fun `一時停止後にWebSocket経由でタイマー状態がブロードキャストされる`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
        service.handleTimer("test1234", TimerRequest(TimerAction.PAUSE, participantId = "p-1"))

        verify(atLeast = 1) {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/timer",
                any<Any>()
            )
        }
    }

    @Test
    fun `リセット後にWebSocket経由でタイマー状態がブロードキャストされる`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        service.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
        service.handleTimer("test1234", TimerRequest(TimerAction.RESET, participantId = "p-1"))

        verify(atLeast = 1) {
            messagingTemplate.convertAndSend(
                "/topic/board/test1234/timer",
                any<Any>()
            )
        }
    }
}
