package com.retra.service

import com.retra.TestFixtures
import com.retra.domain.model.*
import com.retra.domain.repository.BoardColumnRepository
import com.retra.domain.repository.BoardRepository
import com.retra.exception.BadRequestException
import com.retra.exception.ForbiddenException
import com.retra.exception.NotFoundException
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.util.Optional
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class BoardServiceTest {

    private val boardRepository: BoardRepository = mockk()
    private val columnRepository: BoardColumnRepository = mockk()
    private val eventPublisher: ApplicationEventPublisher = mockk(relaxed = true)

    private lateinit var boardService: BoardService

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        boardService = BoardService(boardRepository, columnRepository, eventPublisher)
    }

    @Nested
    inner class CreateBoard {

        @Test
        fun `KPTフレームワークでボード作成 - Keep, Problem, Tryの3カラムが作成される`() {
            every { boardRepository.existsBySlug(any()) } returns false
            every { boardRepository.save(any()) } answers { firstArg() }
            every { columnRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.CreateBoardRequest("My Retro", Framework.KPT, 5)
            val response = boardService.createBoard(request)

            assertEquals("My Retro", response.title)
            assertEquals(Framework.KPT, response.framework)
            assertEquals(3, response.columns.size)
            assertEquals("Keep", response.columns[0].name)
            assertEquals("Problem", response.columns[1].name)
            assertEquals("Try", response.columns[2].name)
            verify(exactly = 1) { boardRepository.save(any()) }
            verify(exactly = 3) { columnRepository.save(any()) }
        }

        @Test
        fun `FunDoneLearnフレームワークでボード作成`() {
            every { boardRepository.existsBySlug(any()) } returns false
            every { boardRepository.save(any()) } answers { firstArg() }
            every { columnRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.CreateBoardRequest("Retro", Framework.FUN_DONE_LEARN)
            val response = boardService.createBoard(request)

            assertEquals(3, response.columns.size)
            assertEquals("Fun", response.columns[0].name)
            assertEquals("Done", response.columns[1].name)
            assertEquals("Learn", response.columns[2].name)
        }

        @Test
        fun `4Lsフレームワークで4カラム作成`() {
            every { boardRepository.existsBySlug(any()) } returns false
            every { boardRepository.save(any()) } answers { firstArg() }
            every { columnRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.CreateBoardRequest("Retro", Framework.FOUR_LS)
            val response = boardService.createBoard(request)

            assertEquals(4, response.columns.size)
            assertEquals("Liked", response.columns[0].name)
            assertEquals("Learned", response.columns[1].name)
            assertEquals("Lacked", response.columns[2].name)
            assertEquals("Longed For", response.columns[3].name)
        }

        @Test
        fun `StartStopContinueフレームワーク`() {
            every { boardRepository.existsBySlug(any()) } returns false
            every { boardRepository.save(any()) } answers { firstArg() }
            every { columnRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.CreateBoardRequest("Retro", Framework.START_STOP_CONTINUE)
            val response = boardService.createBoard(request)

            assertEquals(3, response.columns.size)
            assertEquals("Start", response.columns[0].name)
            assertEquals("Stop", response.columns[1].name)
            assertEquals("Continue", response.columns[2].name)
        }

        @Test
        fun `スラッグは8文字で生成される`() {
            every { boardRepository.existsBySlug(any()) } returns false
            every { boardRepository.save(any()) } answers { firstArg() }
            every { columnRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.CreateBoardRequest("Retro")
            val response = boardService.createBoard(request)

            assertEquals(8, response.slug.length)
        }

        @Test
        fun `スラッグ衝突時にリトライする`() {
            every { boardRepository.existsBySlug(any()) } returnsMany listOf(true, true, false)
            every { boardRepository.save(any()) } answers { firstArg() }
            every { columnRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.CreateBoardRequest("Retro")
            val response = boardService.createBoard(request)

            assertNotNull(response.slug)
            verify(exactly = 3) { boardRepository.existsBySlug(any()) }
        }
    }

    @Nested
    inner class GetBoard {

        @Test
        fun `存在するボードを取得`() {
            val board = TestFixtures.board(slug = "abc12345")
            every { boardRepository.findBySlug("abc12345") } returns Optional.of(board)

            val response = boardService.getBoard("abc12345")

            assertEquals("abc12345", response.slug)
        }

        @Test
        fun `存在しないボードでNotFoundException`() {
            every { boardRepository.findBySlug("notfound") } returns Optional.empty()

            assertFailsWith<NotFoundException> {
                boardService.getBoard("notfound")
            }
        }
    }

    @Nested
    inner class ChangePhase {

        @Test
        fun `WRITING から VOTING への遷移`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
            board.participants.add(facilitator)
            every { boardRepository.findBySlug(any()) } returns Optional.of(board)
            every { boardRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.ChangePhaseRequest(Phase.VOTING, "p-1")
            val response = boardService.changePhase("test1234", request)

            assertEquals(Phase.VOTING, response.phase)
            verify { eventPublisher.publishEvent(match<PhaseChangedEvent> { it.phase == Phase.VOTING }) }
        }

        @Test
        fun `VOTING から DISCUSSION への遷移`() {
            val board = TestFixtures.board(phase = Phase.VOTING)
            val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
            board.participants.add(facilitator)
            every { boardRepository.findBySlug(any()) } returns Optional.of(board)
            every { boardRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.ChangePhaseRequest(Phase.DISCUSSION, "p-1")
            val response = boardService.changePhase("test1234", request)

            assertEquals(Phase.DISCUSSION, response.phase)
        }

        @Test
        fun `DISCUSSION から ACTION_ITEMS への遷移`() {
            val board = TestFixtures.board(phase = Phase.DISCUSSION)
            val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
            board.participants.add(facilitator)
            every { boardRepository.findBySlug(any()) } returns Optional.of(board)
            every { boardRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.ChangePhaseRequest(Phase.ACTION_ITEMS, "p-1")
            val response = boardService.changePhase("test1234", request)

            assertEquals(Phase.ACTION_ITEMS, response.phase)
        }

        @Test
        fun `ACTION_ITEMS から CLOSED への遷移`() {
            val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
            val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
            board.participants.add(facilitator)
            every { boardRepository.findBySlug(any()) } returns Optional.of(board)
            every { boardRepository.save(any()) } answers { firstArg() }

            val request = com.retra.dto.ChangePhaseRequest(Phase.CLOSED, "p-1")
            val response = boardService.changePhase("test1234", request)

            assertEquals(Phase.CLOSED, response.phase)
        }

        @Test
        fun `無効なフェーズ遷移でBadRequestException`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
            board.participants.add(facilitator)
            every { boardRepository.findBySlug(any()) } returns Optional.of(board)

            val request = com.retra.dto.ChangePhaseRequest(Phase.DISCUSSION, "p-1")
            assertFailsWith<BadRequestException> {
                boardService.changePhase("test1234", request)
            }
        }

        @Test
        fun `非ファシリテーターはフェーズ変更不可`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            val member = TestFixtures.participant(id = "p-2", board = board, isFacilitator = false)
            board.participants.add(member)
            every { boardRepository.findBySlug(any()) } returns Optional.of(board)

            val request = com.retra.dto.ChangePhaseRequest(Phase.VOTING, "p-2")
            assertFailsWith<ForbiddenException> {
                boardService.changePhase("test1234", request)
            }
        }

        @Test
        fun `不明な参加者でNotFoundException`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            every { boardRepository.findBySlug(any()) } returns Optional.of(board)

            val request = com.retra.dto.ChangePhaseRequest(Phase.VOTING, "unknown")
            assertFailsWith<NotFoundException> {
                boardService.changePhase("test1234", request)
            }
        }
    }

    @Nested
    inner class ToResponse {

        @Test
        fun `ボードレスポンスのマッピング検証`() {
            val board = TestFixtures.board()
            val col = TestFixtures.boardColumn(board = board)
            val participant = TestFixtures.participant(board = board, isFacilitator = true)
            val card = TestFixtures.card(column = col, board = board, participant = participant)
            col.cards.add(card)
            board.columns.add(col)
            board.participants.add(participant)

            val response = boardService.toResponse(board)

            assertEquals(board.id, response.id)
            assertEquals(board.slug, response.slug)
            assertEquals(1, response.columns.size)
            assertEquals(1, response.columns[0].cards.size)
            assertEquals(1, response.participants.size)
            assertTrue(response.participants[0].isFacilitator)
        }
    }
}
