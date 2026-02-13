package com.retra.board.usecase

import com.retra.board.domain.Framework
import com.retra.board.domain.Phase
import com.retra.card.usecase.CardResponse

data class CreateBoardRequest(
    val title: String,
    val framework: Framework = Framework.KPT,
    val maxVotesPerPerson: Int = 5,
    val isAnonymous: Boolean = false
)

data class ChangePhaseRequest(
    val phase: Phase,
    val participantId: String
)

data class JoinBoardRequest(
    val nickname: String
)

data class BoardResponse(
    val id: String,
    val slug: String,
    val title: String,
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
