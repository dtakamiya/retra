package com.retra.icebreaker.gateway.controller

import com.retra.icebreaker.usecase.*
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/icebreaker")
class IcebreakerController(
    private val getIcebreakerUseCase: GetIcebreakerUseCase,
    private val setIcebreakerQuestionUseCase: SetIcebreakerQuestionUseCase,
    private val submitAnswerUseCase: SubmitIcebreakerAnswerUseCase,
    private val updateAnswerUseCase: UpdateIcebreakerAnswerUseCase,
    private val deleteAnswerUseCase: DeleteIcebreakerAnswerUseCase
) {
    @GetMapping
    fun getIcebreaker(@PathVariable slug: String): IcebreakerResponse {
        return getIcebreakerUseCase.execute(slug)
    }

    @PostMapping("/question")
    fun setQuestion(
        @PathVariable slug: String,
        @Valid @RequestBody request: SetQuestionRequest
    ): IcebreakerResponse {
        return setIcebreakerQuestionUseCase.execute(slug, request)
    }

    @PostMapping("/answers")
    @ResponseStatus(HttpStatus.CREATED)
    fun submitAnswer(
        @PathVariable slug: String,
        @Valid @RequestBody request: SubmitAnswerRequest
    ): IcebreakerAnswerResponse {
        return submitAnswerUseCase.execute(slug, request)
    }

    @PutMapping("/answers/{answerId}")
    fun updateAnswer(
        @PathVariable slug: String,
        @PathVariable answerId: String,
        @Valid @RequestBody request: UpdateAnswerRequest
    ): IcebreakerAnswerResponse {
        return updateAnswerUseCase.execute(slug, answerId, request)
    }

    @DeleteMapping("/answers/{answerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteAnswer(
        @PathVariable slug: String,
        @PathVariable answerId: String,
        @RequestParam participantId: String
    ) {
        deleteAnswerUseCase.execute(slug, answerId, participantId)
    }
}
