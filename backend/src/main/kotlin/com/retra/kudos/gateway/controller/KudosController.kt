package com.retra.kudos.gateway.controller

import com.retra.kudos.usecase.*
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/kudos")
class KudosController(
    private val sendKudosUseCase: SendKudosUseCase,
    private val getKudosUseCase: GetKudosUseCase,
    private val deleteKudosUseCase: DeleteKudosUseCase
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun sendKudos(
        @PathVariable slug: String,
        @Valid @RequestBody request: SendKudosRequest
    ): KudosResponse {
        return sendKudosUseCase.execute(slug, request)
    }

    @GetMapping
    fun getKudos(@PathVariable slug: String): List<KudosResponse> {
        return getKudosUseCase.execute(slug)
    }

    @DeleteMapping("/{kudosId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteKudos(
        @PathVariable slug: String,
        @PathVariable kudosId: String,
        @RequestParam participantId: String
    ) {
        deleteKudosUseCase.execute(slug, kudosId, participantId)
    }
}
