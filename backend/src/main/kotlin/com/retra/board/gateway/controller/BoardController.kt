package com.retra.board.gateway.controller

import com.retra.board.usecase.BoardResponse
import com.retra.board.usecase.ChangePhaseRequest
import com.retra.board.usecase.CreateBoardRequest
import com.retra.board.usecase.JoinBoardRequest
import com.retra.board.usecase.ParticipantResponse
import com.retra.board.usecase.CreateBoardUseCase
import com.retra.board.usecase.GetBoardUseCase
import com.retra.board.usecase.JoinBoardUseCase
import com.retra.board.usecase.TransitionPhaseUseCase
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards")
class BoardController(
    private val createBoardUseCase: CreateBoardUseCase,
    private val getBoardUseCase: GetBoardUseCase,
    private val transitionPhaseUseCase: TransitionPhaseUseCase,
    private val joinBoardUseCase: JoinBoardUseCase
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createBoard(@RequestBody request: CreateBoardRequest): BoardResponse {
        return createBoardUseCase.execute(request)
    }

    @GetMapping("/{slug}")
    fun getBoard(@PathVariable slug: String): BoardResponse {
        return getBoardUseCase.execute(slug)
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
}
