package com.retra.dto

import com.retra.domain.model.*

// === Request DTOs ===

data class CreateBoardRequest(
    val title: String,
    val framework: Framework = Framework.KPT,
    val maxVotesPerPerson: Int = 5
)

data class ChangePhaseRequest(
    val phase: Phase,
    val participantId: String
)

data class JoinBoardRequest(
    val nickname: String
)

data class CreateCardRequest(
    val columnId: String,
    val content: String,
    val participantId: String
)

data class UpdateCardRequest(
    val content: String,
    val participantId: String
)

data class DeleteCardRequest(
    val participantId: String
)

data class MoveCardRequest(
    val targetColumnId: String,
    val sortOrder: Int,
    val participantId: String
)

data class VoteRequest(
    val cardId: String,
    val participantId: String
)

data class RemoveVoteRequest(
    val cardId: String,
    val participantId: String
)

data class TimerRequest(
    val action: TimerAction,
    val durationSeconds: Int? = null,
    val participantId: String
)

enum class TimerAction {
    START, PAUSE, RESUME, RESET
}

// === Response DTOs ===

data class BoardResponse(
    val id: String,
    val slug: String,
    val title: String,
    val framework: Framework,
    val phase: Phase,
    val maxVotesPerPerson: Int,
    val columns: List<ColumnResponse>,
    val participants: List<ParticipantResponse>,
    val createdAt: String,
    val updatedAt: String
)

data class ColumnResponse(
    val id: String,
    val name: String,
    val sortOrder: Int,
    val color: String,
    val cards: List<CardResponse>
)

data class CardResponse(
    val id: String,
    val columnId: String,
    val content: String,
    val authorNickname: String?,
    val participantId: String?,
    val voteCount: Int,
    val sortOrder: Int,
    val createdAt: String,
    val updatedAt: String
)

data class ParticipantResponse(
    val id: String,
    val nickname: String,
    val isFacilitator: Boolean,
    val isOnline: Boolean,
    val createdAt: String
)

data class VoteResponse(
    val id: String,
    val cardId: String,
    val participantId: String,
    val createdAt: String
)

data class RemainingVotesResponse(
    val participantId: String,
    val remaining: Int,
    val max: Int,
    val used: Int
)

data class TimerStateResponse(
    val isRunning: Boolean,
    val remainingSeconds: Int,
    val totalSeconds: Int
)
