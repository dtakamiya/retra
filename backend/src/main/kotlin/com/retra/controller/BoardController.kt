package com.retra.controller

import com.retra.dto.*
import com.retra.service.BoardService
import com.retra.service.ParticipantService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards")
class BoardController(
    private val boardService: BoardService,
    private val participantService: ParticipantService
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createBoard(@RequestBody request: CreateBoardRequest): BoardResponse {
        return boardService.createBoard(request)
    }

    @GetMapping("/{slug}")
    fun getBoard(@PathVariable slug: String): BoardResponse {
        return boardService.getBoard(slug)
    }

    @PatchMapping("/{slug}/phase")
    fun changePhase(
        @PathVariable slug: String,
        @RequestBody request: ChangePhaseRequest
    ): BoardResponse {
        return boardService.changePhase(slug, request)
    }

    @PostMapping("/{slug}/participants")
    @ResponseStatus(HttpStatus.CREATED)
    fun joinBoard(
        @PathVariable slug: String,
        @RequestBody request: JoinBoardRequest
    ): ParticipantResponse {
        return participantService.joinBoard(slug, request)
    }
}
