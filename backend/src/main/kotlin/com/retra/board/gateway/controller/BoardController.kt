package com.retra.board.gateway.controller

import com.retra.board.usecase.BoardResponse
import com.retra.board.usecase.ChangePhaseRequest
import com.retra.board.usecase.CreateBoardRequest
import com.retra.board.usecase.ExportBoardRequest
import com.retra.board.usecase.ExportBoardUseCase
import com.retra.board.usecase.ExportFormat
import com.retra.board.usecase.JoinBoardRequest
import com.retra.board.usecase.ParticipantResponse
import com.retra.board.usecase.CreateBoardUseCase
import com.retra.board.usecase.GetBoardUseCase
import com.retra.board.usecase.JoinBoardUseCase
import com.retra.board.usecase.TransitionPhaseUseCase
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards")
class BoardController(
    private val createBoardUseCase: CreateBoardUseCase,
    private val getBoardUseCase: GetBoardUseCase,
    private val transitionPhaseUseCase: TransitionPhaseUseCase,
    private val joinBoardUseCase: JoinBoardUseCase,
    private val exportBoardUseCase: ExportBoardUseCase
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createBoard(@RequestBody request: CreateBoardRequest): BoardResponse {
        return createBoardUseCase.execute(request)
    }

    @GetMapping("/{slug}")
    fun getBoard(
        @PathVariable slug: String,
        @RequestParam(required = false) participantId: String?
    ): BoardResponse {
        return getBoardUseCase.execute(slug, participantId)
    }

    @PatchMapping("/{slug}/phase")
    fun changePhase(
        @PathVariable slug: String,
        @RequestBody request: ChangePhaseRequest
    ): BoardResponse {
        return transitionPhaseUseCase.execute(slug, request)
    }

    @PostMapping("/{slug}/participants")
    @ResponseStatus(HttpStatus.CREATED)
    fun joinBoard(
        @PathVariable slug: String,
        @RequestBody request: JoinBoardRequest
    ): ParticipantResponse {
        return joinBoardUseCase.execute(slug, request)
    }

    @GetMapping("/{slug}/export")
    fun exportBoard(
        @PathVariable slug: String,
        @RequestParam participantId: String,
        @RequestParam format: ExportFormat
    ): ResponseEntity<ByteArray> {
        val bytes = exportBoardUseCase.execute(slug, ExportBoardRequest(participantId, format))

        val contentType = when (format) {
            ExportFormat.CSV -> "text/csv; charset=UTF-8"
            ExportFormat.MARKDOWN -> "text/markdown; charset=UTF-8"
        }
        val extension = when (format) {
            ExportFormat.CSV -> "csv"
            ExportFormat.MARKDOWN -> "md"
        }

        val disposition = ContentDisposition.attachment()
            .filename("${slug}_export.${extension}", Charsets.UTF_8)
            .build()

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
            .contentType(MediaType.parseMediaType(contentType))
            .body(bytes)
    }
}
