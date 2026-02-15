package com.retra.card.gateway.controller

import com.retra.card.usecase.AddReactionRequest
import com.retra.card.usecase.AddReactionUseCase
import com.retra.card.usecase.ReactionResponse
import com.retra.card.usecase.RemoveReactionRequest
import com.retra.card.usecase.RemoveReactionUseCase
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/reactions")
class ReactionController(
    private val addReactionUseCase: AddReactionUseCase,
    private val removeReactionUseCase: RemoveReactionUseCase
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun addReaction(
        @PathVariable slug: String,
        @Valid @RequestBody request: AddReactionRequest
    ): ReactionResponse {
        return addReactionUseCase.execute(slug, request)
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun removeReaction(
        @PathVariable slug: String,
        @RequestParam cardId: String,
        @RequestParam participantId: String,
        @RequestParam emoji: String
    ) {
        removeReactionUseCase.execute(slug, RemoveReactionRequest(cardId, participantId, emoji))
    }
}
