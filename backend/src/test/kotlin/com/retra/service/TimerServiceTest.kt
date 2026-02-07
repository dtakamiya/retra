package com.retra.service

import com.retra.TestFixtures
import com.retra.dto.TimerAction
import com.retra.dto.TimerRequest
import com.retra.exception.BadRequestException
import com.retra.exception.ForbiddenException
import com.retra.exception.NotFoundException
import io.mockk.*
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.messaging.simp.SimpMessagingTemplate
import java.util.Optional
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class TimerServiceTest {

    private val boardService: BoardService = mockk()
    private val messagingTemplate: SimpMessagingTemplate = mockk(relaxed = true)

    private lateinit var timerService: TimerService

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        timerService = TimerService(boardService, messagingTemplate)
    }

    @AfterEach
    fun tearDown() {
        timerService.shutdown()
    }

    private fun setupBoard(isFacilitator: Boolean = true, participantId: String = "p-1") {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(
            id = participantId,
            board = board,
            isFacilitator = isFacilitator
        )
        board.participants.add(participant)
        every { boardService.findBoardBySlug(any()) } returns board
    }

    @Nested
    inner class Start {

        @Test
        fun `STARTアクションでタイマー開始`() {
            setupBoard()

            val response = timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))

            assertTrue(response.isRunning)
            assertEquals(300, response.remainingSeconds)
            assertEquals(300, response.totalSeconds)
        }

        @Test
        fun `durationSeconds省略時はデフォルト300秒`() {
            setupBoard()

            val response = timerService.handleTimer("test1234", TimerRequest(TimerAction.START, null, "p-1"))

            assertEquals(300, response.totalSeconds)
        }

        @Test
        fun `duration 1秒の境界値テスト`() {
            setupBoard()

            val response = timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 1, "p-1"))

            assertEquals(1, response.totalSeconds)
        }

        @Test
        fun `duration 3600秒の境界値テスト`() {
            setupBoard()

            val response = timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 3600, "p-1"))

            assertEquals(3600, response.totalSeconds)
        }

        @Test
        fun `duration 0秒でBadRequestException`() {
            setupBoard()

            assertFailsWith<BadRequestException> {
                timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 0, "p-1"))
            }
        }

        @Test
        fun `duration 3601秒でBadRequestException`() {
            setupBoard()

            assertFailsWith<BadRequestException> {
                timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 3601, "p-1"))
            }
        }
    }

    @Nested
    inner class Pause {

        @Test
        fun `PAUSEアクションでタイマー一時停止`() {
            setupBoard()
            timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))

            val response = timerService.handleTimer("test1234", TimerRequest(TimerAction.PAUSE, null, "p-1"))

            assertFalse(response.isRunning)
        }
    }

    @Nested
    inner class Resume {

        @Test
        fun `RESUMEでタイマー再開`() {
            setupBoard()
            timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
            timerService.handleTimer("test1234", TimerRequest(TimerAction.PAUSE, null, "p-1"))

            val response = timerService.handleTimer("test1234", TimerRequest(TimerAction.RESUME, null, "p-1"))

            assertTrue(response.isRunning)
        }

        @Test
        fun `remainingSeconds=0の場合RESUMEしても再開しない`() {
            setupBoard()
            timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
            timerService.handleTimer("test1234", TimerRequest(TimerAction.RESET, null, "p-1"))

            val response = timerService.handleTimer("test1234", TimerRequest(TimerAction.RESUME, null, "p-1"))

            assertFalse(response.isRunning)
        }
    }

    @Nested
    inner class Reset {

        @Test
        fun `RESETでタイマー初期化`() {
            setupBoard()
            timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))

            val response = timerService.handleTimer("test1234", TimerRequest(TimerAction.RESET, null, "p-1"))

            assertFalse(response.isRunning)
            assertEquals(0, response.remainingSeconds)
            assertEquals(0, response.totalSeconds)
        }
    }

    @Nested
    inner class Authorization {

        @Test
        fun `非ファシリテーターでForbiddenException`() {
            setupBoard(isFacilitator = false)

            assertFailsWith<ForbiddenException> {
                timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "p-1"))
            }
        }

        @Test
        fun `不明な参加者でNotFoundException`() {
            val board = TestFixtures.board()
            every { boardService.findBoardBySlug(any()) } returns board

            assertFailsWith<NotFoundException> {
                timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 300, "unknown"))
            }
        }
    }

    @Nested
    inner class GetTimerState {

        @Test
        fun `タイマー未設定時のデフォルト値`() {
            val response = timerService.getTimerState("unknown-slug")

            assertFalse(response.isRunning)
            assertEquals(0, response.remainingSeconds)
            assertEquals(0, response.totalSeconds)
        }

        @Test
        fun `タイマー設定済みの状態取得`() {
            setupBoard()
            timerService.handleTimer("test1234", TimerRequest(TimerAction.START, 120, "p-1"))

            val response = timerService.getTimerState("test1234")

            assertTrue(response.isRunning)
            assertEquals(120, response.totalSeconds)
        }
    }
}
