package com.retra.board.domain

import com.retra.shared.domain.InvalidPhaseTransitionException

enum class Phase {
    ICEBREAK,
    WRITING,
    VOTING,
    DISCUSSION,
    ACTION_ITEMS,
    CLOSED;

    fun canTransitionTo(target: Phase): Boolean {
        return validTransitions[this] == target
    }

    fun transitionTo(target: Phase): Phase {
        if (!canTransitionTo(target)) {
            throw InvalidPhaseTransitionException(
                "Invalid phase transition: $this -> $target"
            )
        }
        return target
    }

    fun canCreateCard(): Boolean = this == WRITING

    fun canVote(): Boolean = this == VOTING

    fun canMoveCard(): Boolean = this in MOVABLE_PHASES

    fun canMoveCardCrossColumn(): Boolean = this == WRITING

    fun requiresAuthorForMove(): Boolean = this == WRITING

    fun requiresFacilitatorForMove(): Boolean = this in FACILITATOR_MOVE_PHASES

    fun canCreateMemo(): Boolean = this in MEMO_PHASES

    fun canCreateActionItem(): Boolean = this == ACTION_ITEMS

    fun canMarkDiscussed(): Boolean = this in MEMO_PHASES

    fun canAnswerIcebreaker(): Boolean = this == ICEBREAK

    companion object {
        private val validTransitions = mapOf(
            ICEBREAK to WRITING,
            WRITING to VOTING,
            VOTING to DISCUSSION,
            DISCUSSION to ACTION_ITEMS,
            ACTION_ITEMS to CLOSED
        )

        private val MOVABLE_PHASES = listOf(WRITING, DISCUSSION, ACTION_ITEMS)
        private val FACILITATOR_MOVE_PHASES = listOf(DISCUSSION, ACTION_ITEMS)
        private val MEMO_PHASES = listOf(DISCUSSION, ACTION_ITEMS)
    }
}
