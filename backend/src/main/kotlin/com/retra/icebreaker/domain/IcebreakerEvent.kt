package com.retra.icebreaker.domain

import com.retra.shared.domain.DomainEvent

sealed class IcebreakerEvent : DomainEvent() {

    data class QuestionSet(
        val boardSlug: String,
        val question: String
    ) : IcebreakerEvent()

    data class AnswerSubmitted(
        val boardSlug: String,
        val answerId: String,
        val participantId: String,
        val participantNickname: String,
        val answerText: String,
        val createdAt: String
    ) : IcebreakerEvent()

    data class AnswerUpdated(
        val boardSlug: String,
        val answerId: String,
        val participantId: String,
        val participantNickname: String,
        val answerText: String
    ) : IcebreakerEvent()

    data class AnswerDeleted(
        val boardSlug: String,
        val answerId: String
    ) : IcebreakerEvent()
}
