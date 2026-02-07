package com.retra.controller

import com.retra.dto.*
import com.retra.service.VoteService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/votes")
class VoteController(
    private val voteService: VoteService
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun addVote(
        @PathVariable slug: String,
        @RequestBody request: VoteRequest
    ): VoteResponse {
        return voteService.addVote(slug, request)
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun removeVote(
        @PathVariable slug: String,
        @RequestBody request: RemoveVoteRequest
    ) {
        voteService.removeVote(slug, request)
    }

    @GetMapping("/remaining")
    fun getRemainingVotes(
        @PathVariable slug: String,
        @RequestParam participantId: String
    ): RemainingVotesResponse {
        return voteService.getRemainingVotes(slug, participantId)
    }
}
