package com.retra.board.usecase

import com.retra.board.domain.Framework
import com.retra.board.domain.Phase
import com.retra.card.usecase.CardResponse
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateBoardRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 200, message = "Title must be 200 characters or less")
    val title: String,
    val framework: Framework = Framework.KPT,
    @field:Min(1) @field:Max(20)
    val maxVotesPerPerson: Int = 5,
    val isAnonymous: Boolean = false,
    @field:Size(max = 100)
    val teamName: String? = null
)

data class ChangePhaseRequest(
    val phase: Phase,
    val participantId: String
)

data class JoinBoardRequest(
    @field:NotBlank(message = "Nickname is required")
    @field:Size(max = 50, message = "Nickname must be 50 characters or less")
    val nickname: String
)

data class BoardResponse(
    val id: String,
    val slug: String,
    val title: String,
    val teamName: String?,
    val framework: Framework,
    val phase: Phase,
    val maxVotesPerPerson: Int,
    val isAnonymous: Boolean,
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

data class ParticipantResponse(
    val id: String,
    val nickname: String,
    val isFacilitator: Boolean,
    val isOnline: Boolean,
    val createdAt: String
)
