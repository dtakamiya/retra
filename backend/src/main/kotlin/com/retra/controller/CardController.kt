package com.retra.controller

import com.retra.dto.*
import com.retra.service.CardService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/cards")
class CardController(
    private val cardService: CardService
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createCard(
        @PathVariable slug: String,
        @RequestBody request: CreateCardRequest
    ): CardResponse {
        return cardService.createCard(slug, request)
    }

    @PutMapping("/{cardId}")
    fun updateCard(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @RequestBody request: UpdateCardRequest
    ): CardResponse {
        return cardService.updateCard(slug, cardId, request)
    }

    @DeleteMapping("/{cardId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteCard(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @RequestBody request: DeleteCardRequest
    ) {
        cardService.deleteCard(slug, cardId, request)
    }

    @PatchMapping("/{cardId}/move")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun moveCard(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @RequestBody request: MoveCardRequest
    ) {
        cardService.moveCard(slug, cardId, request)
    }
}
