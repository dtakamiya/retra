package com.retra.icebreaker.usecase

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SetQuestionRequest(
    @field:NotBlank
    val participantId: String,
    @field:NotBlank
    val type: String,
    @field:Size(max = 200)
    val questionText: String? = null
)

data class SubmitAnswerRequest(
    @field:NotBlank
    val participantId: String,
    @field:NotBlank
    @field:Size(max = 140)
    val answerText: String
)

data class UpdateAnswerRequest(
    @field:NotBlank
    val participantId: String,
    @field:NotBlank
    @field:Size(max = 140)
    val answerText: String
)

data class IcebreakerResponse(
    val question: String?,
    val answers: List<IcebreakerAnswerResponse>
)

data class IcebreakerAnswerResponse(
    val id: String,
    val participantId: String,
    val participantNickname: String,
    val answerText: String,
    val createdAt: String
)
