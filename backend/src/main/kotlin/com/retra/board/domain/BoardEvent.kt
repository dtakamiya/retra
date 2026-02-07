package com.retra.board.domain

import com.retra.shared.domain.DomainEvent

sealed class BoardEvent : DomainEvent {

    data class BoardCreated(
        val boardId: String,
        val slug: String
    ) : BoardEvent()

    data class PhaseChanged(
        val slug: String,
        val phase: Phase
    ) : BoardEvent()

    data class ParticipantJoined(
        val slug: String,
        val participantId: String,
        val nickname: String,
        val isFacilitator: Boolean
    ) : BoardEvent()

    data class ParticipantOnlineChanged(
        val slug: String,
        val participantId: String,
        val isOnline: Boolean
    ) : BoardEvent()
}
