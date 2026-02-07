package com.retra

import com.retra.domain.model.*
import com.retra.dto.*
import java.time.Instant
import java.util.UUID

object TestFixtures {

    fun board(
        id: String = UUID.randomUUID().toString(),
        slug: String = "test1234",
        title: String = "Test Retro",
        framework: Framework = Framework.KPT,
        phase: Phase = Phase.WRITING,
        maxVotesPerPerson: Int = 5,
        createdAt: String = Instant.now().toString(),
        updatedAt: String = Instant.now().toString()
    ): Board = Board(
        id = id,
        slug = slug,
        title = title,
        framework = framework,
        phase = phase,
        maxVotesPerPerson = maxVotesPerPerson,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    fun boardColumn(
        id: String = UUID.randomUUID().toString(),
        board: Board? = null,
        name: String = "Keep",
        sortOrder: Int = 0,
        color: String = "#22c55e"
    ): BoardColumn = BoardColumn(
        id = id,
        board = board,
        name = name,
        sortOrder = sortOrder,
        color = color
    )

    fun participant(
        id: String = UUID.randomUUID().toString(),
        board: Board? = null,
        nickname: String = "TestUser",
        isFacilitator: Boolean = false,
        isOnline: Boolean = true,
        sessionId: String? = null,
        createdAt: String = Instant.now().toString()
    ): Participant = Participant(
        id = id,
        board = board,
        nickname = nickname,
        isFacilitator = isFacilitator,
        isOnline = isOnline,
        sessionId = sessionId,
        createdAt = createdAt
    )

    fun card(
        id: String = UUID.randomUUID().toString(),
        column: BoardColumn? = null,
        board: Board? = null,
        content: String = "Test card content",
        authorNickname: String? = "TestUser",
        participant: Participant? = null,
        sortOrder: Int = 0,
        createdAt: String = Instant.now().toString(),
        updatedAt: String = Instant.now().toString()
    ): Card = Card(
        id = id,
        column = column,
        board = board,
        content = content,
        authorNickname = authorNickname,
        participant = participant,
        sortOrder = sortOrder,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    fun vote(
        id: String = UUID.randomUUID().toString(),
        card: Card? = null,
        participant: Participant? = null,
        createdAt: String = Instant.now().toString()
    ): Vote = Vote(
        id = id,
        card = card,
        participant = participant,
        createdAt = createdAt
    )
}
