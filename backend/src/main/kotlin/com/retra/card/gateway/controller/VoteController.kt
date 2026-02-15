package com.retra.card.gateway.controller

import com.retra.card.usecase.RemainingVotesResponse
import com.retra.card.usecase.RemoveVoteRequest
import com.retra.card.usecase.VoteRequest
import com.retra.card.usecase.VoteResponse
import com.retra.card.usecase.AddVoteUseCase
import com.retra.card.usecase.GetRemainingVotesUseCase
import com.retra.card.usecase.RemoveVoteUseCase
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/votes")
class VoteController(
    private val addVoteUseCase: AddVoteUseCase,
    private val removeVoteUseCase: RemoveVoteUseCase,
    private val getRemainingVotesUseCase: GetRemainingVotesUseCase
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun addVote(
        @PathVariable slug: String,
        @Valid @RequestBody request: VoteRequest
    ): VoteResponse {
        return addVoteUseCase.execute(slug, request)
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun removeVote(
        @PathVariable slug: String,
        @RequestParam cardId: String,
        @RequestParam participantId: String
    ) {
        removeVoteUseCase.execute(slug, RemoveVoteRequest(cardId, participantId))
    }

    @GetMapping("/remaining")
    fun getRemainingVotes(
        @PathVariable slug: String,
        @RequestParam participantId: String
    ): RemainingVotesResponse {
        return getRemainingVotesUseCase.execute(slug, participantId)
    }
}
