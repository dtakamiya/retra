package com.retra.card.gateway.controller

import com.retra.card.usecase.CardResponse
import com.retra.card.usecase.CreateCardRequest
import com.retra.card.usecase.DeleteCardRequest
import com.retra.card.usecase.MarkCardDiscussedRequest
import com.retra.card.usecase.MoveCardRequest
import com.retra.card.usecase.UpdateCardRequest
import com.retra.card.usecase.CreateCardUseCase
import com.retra.card.usecase.DeleteCardUseCase
import com.retra.card.usecase.MarkCardDiscussedUseCase
import com.retra.card.usecase.MoveCardUseCase
import com.retra.card.usecase.UpdateCardUseCase
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/cards")
class CardController(
    private val createCardUseCase: CreateCardUseCase,
    private val updateCardUseCase: UpdateCardUseCase,
    private val deleteCardUseCase: DeleteCardUseCase,
    private val moveCardUseCase: MoveCardUseCase,
    private val markCardDiscussedUseCase: MarkCardDiscussedUseCase
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createCard(
        @PathVariable slug: String,
        @Valid @RequestBody request: CreateCardRequest
    ): CardResponse {
        return createCardUseCase.execute(slug, request)
    }

    @PutMapping("/{cardId}")
    fun updateCard(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @Valid @RequestBody request: UpdateCardRequest
    ): CardResponse {
        return updateCardUseCase.execute(slug, cardId, request)
    }

    @DeleteMapping("/{cardId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteCard(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @RequestParam participantId: String
    ) {
        deleteCardUseCase.execute(slug, cardId, DeleteCardRequest(participantId))
    }

    @PatchMapping("/{cardId}/move")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun moveCard(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @Valid @RequestBody request: MoveCardRequest
    ) {
        moveCardUseCase.execute(slug, cardId, request)
    }

    @PatchMapping("/{cardId}/discussed")
    fun markDiscussed(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @Valid @RequestBody request: MarkCardDiscussedRequest
    ): CardResponse {
        return markCardDiscussedUseCase.execute(slug, cardId, request)
    }
}
