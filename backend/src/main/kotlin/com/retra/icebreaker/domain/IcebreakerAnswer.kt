package com.retra.icebreaker.domain

import com.retra.shared.domain.BadRequestException
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "icebreaker_answers")
open class IcebreakerAnswer(
    @Id
    open var id: String = "",

    @Column(name = "board_id", nullable = false)
    open var boardId: String = "",

    @Column(name = "participant_id", nullable = false)
    open var participantId: String = "",

    @Column(name = "answer_text", nullable = false)
    open var answerText: String = "",

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = ""
) {
    fun updateText(newText: String) {
        val trimmed = newText.trim()
        validate(trimmed)
        answerText = trimmed
    }

    companion object {
        private const val MAX_LENGTH = 140

        private fun validate(text: String) {
            if (text.isBlank()) {
                throw BadRequestException("Answer text must not be blank")
            }
            if (text.length > MAX_LENGTH) {
                throw BadRequestException("Answer text must be $MAX_LENGTH characters or less")
            }
        }

        fun create(boardId: String, participantId: String, answerText: String): IcebreakerAnswer {
            val trimmed = answerText.trim()
            validate(trimmed)
            return IcebreakerAnswer(
                id = UUID.randomUUID().toString(),
                boardId = boardId,
                participantId = participantId,
                answerText = trimmed,
                createdAt = Instant.now().toString()
            )
        }
    }
}
