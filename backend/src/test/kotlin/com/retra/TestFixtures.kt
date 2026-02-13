package com.retra

import com.retra.actionitem.domain.ActionItem
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.Board
import com.retra.board.domain.BoardColumn
import com.retra.board.domain.Participant
import com.retra.card.domain.Card
import com.retra.card.domain.Reaction
import com.retra.card.domain.Vote
import com.retra.board.domain.Framework
import com.retra.board.domain.Phase
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

    fun reaction(
        id: String = UUID.randomUUID().toString(),
        card: Card? = null,
        board: Board? = null,
        participant: Participant? = null,
        emoji: String = "👍",
        createdAt: String = Instant.now().toString()
    ): Reaction = Reaction(
        id = id,
        card = card,
        board = board,
        participant = participant,
        emoji = emoji,
        createdAt = createdAt
    )

    fun actionItem(
        id: String = UUID.randomUUID().toString(),
        board: Board = board(),
        card: Card? = null,
        content: String = "サンプルアクションアイテム",
        assignee: Participant? = null,
        dueDate: String? = null,
        status: ActionItemStatus = ActionItemStatus.OPEN,
        sortOrder: Int = 0,
        createdAt: String = Instant.now().toString(),
        updatedAt: String = Instant.now().toString()
    ): ActionItem = ActionItem(
        id = id,
        board = board,
        card = card,
        content = content,
        assignee = assignee,
        dueDate = dueDate,
        status = status,
        sortOrder = sortOrder,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
