package com.retra.board.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.board.usecase.export.CsvExportService
import com.retra.board.usecase.export.MarkdownExportService
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class ExportBoardUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val csvExportService = mockk<CsvExportService>()
    private val markdownExportService = mockk<MarkdownExportService>()
    private val useCase = ExportBoardUseCase(boardRepository, csvExportService, markdownExportService)

    @Test
    fun `ファシリテーターがCSVエクスポートに成功する`() {
        val board = TestFixtures.board(slug = "test1234")
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        val column = TestFixtures.boardColumn(board = board)
        board.columns.add(column)

        every { boardRepository.findBySlug("test1234") } returns board
        every { csvExportService.export(any()) } returns "csv-data".toByteArray()

        val result = useCase.execute("test1234", ExportBoardRequest("p-1", ExportFormat.CSV))

        assertEquals("csv-data", String(result))
        verify { csvExportService.export(any()) }
    }

    @Test
    fun `ファシリテーターがMarkdownエクスポートに成功する`() {
        val board = TestFixtures.board(slug = "test1234")
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        val column = TestFixtures.boardColumn(board = board)
        board.columns.add(column)

        every { boardRepository.findBySlug("test1234") } returns board
        every { markdownExportService.export(any()) } returns "# markdown".toByteArray()

        val result = useCase.execute("test1234", ExportBoardRequest("p-1", ExportFormat.MARKDOWN))

        assertEquals("# markdown", String(result))
        verify { markdownExportService.export(any()) }
    }

    @Test
    fun `非ファシリテーターはエクスポートできない`() {
        val board = TestFixtures.board(slug = "test1234")
        val member = TestFixtures.participant(id = "p-2", board = board, isFacilitator = false)
        board.participants.add(member)

        every { boardRepository.findBySlug("test1234") } returns board

        assertThrows<ForbiddenException> {
            useCase.execute("test1234", ExportBoardRequest("p-2", ExportFormat.CSV))
        }
    }

    @Test
    fun `存在しないボードで404エラー`() {
        every { boardRepository.findBySlug("unknown") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("unknown", ExportBoardRequest("p-1", ExportFormat.CSV))
        }
    }

    @Test
    fun `存在しないparticipantIdで404エラー`() {
        val board = TestFixtures.board(slug = "test1234")
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)

        every { boardRepository.findBySlug("test1234") } returns board

        assertThrows<NotFoundException> {
            useCase.execute("test1234", ExportBoardRequest("nonexistent-id", ExportFormat.CSV))
        }
    }

    @Test
    fun `WRITINGフェーズでは自分のカードのみエクスポートされる`() {
        val board = TestFixtures.board(slug = "test1234", phase = Phase.WRITING)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true, nickname = "Alice")
        val other = TestFixtures.participant(id = "p-2", board = board, isFacilitator = false, nickname = "Bob")
        board.participants.addAll(listOf(facilitator, other))

        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val myCard = TestFixtures.card(id = "card-1", column = column, board = board, participant = facilitator, authorNickname = "Alice")
        val otherCard = TestFixtures.card(id = "card-2", column = column, board = board, participant = other, authorNickname = "Bob")
        column.cards.addAll(listOf(myCard, otherCard))
        board.columns.add(column)

        every { boardRepository.findBySlug("test1234") } returns board
        every { csvExportService.export(any()) } answers {
            val boardResp = firstArg<BoardResponse>()
            // WRITINGフェーズでは自分のカードのみ
            assertEquals(1, boardResp.columns.flatMap { it.cards }.size)
            assertEquals("p-1", boardResp.columns.flatMap { it.cards }.first().participantId)
            "filtered-csv".toByteArray()
        }

        val result = useCase.execute("test1234", ExportBoardRequest("p-1", ExportFormat.CSV))
        assertEquals("filtered-csv", String(result))
    }
}
