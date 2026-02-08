package com.retra.board.usecase

import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.board.usecase.export.CsvExportService
import com.retra.board.usecase.export.MarkdownExportService
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ExportBoardUseCase(
    private val boardRepository: BoardRepository,
    private val csvExportService: CsvExportService,
    private val markdownExportService: MarkdownExportService
) {

    @Transactional(readOnly = true)
    fun execute(slug: String, request: ExportBoardRequest): ByteArray {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        val participant = board.findParticipantById(request.participantId)
        if (!participant.isFacilitator) {
            throw ForbiddenException("Only facilitator can export board")
        }

        val boardResponse = BoardMapper.toBoardResponse(board)

        // WRITINGフェーズでは自分のカードのみ
        val filteredResponse = if (board.phase == Phase.WRITING) {
            boardResponse.copy(
                columns = boardResponse.columns.map { col ->
                    col.copy(cards = col.cards.filter { it.participantId == request.participantId })
                }
            )
        } else {
            boardResponse
        }

        return when (request.format) {
            ExportFormat.CSV -> csvExportService.export(filteredResponse)
            ExportFormat.MARKDOWN -> markdownExportService.export(filteredResponse)
        }
    }
}
