package com.retra.history.domain

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "board_snapshots")
open class BoardSnapshot(
    @Id
    open var id: String = UUID.randomUUID().toString(),

    @Column(name = "board_id", nullable = false)
    open var boardId: String = "",

    @Column(name = "team_name", nullable = false)
    open var teamName: String = "",

    @Column(nullable = false)
    open var framework: String = "",

    @Column(name = "closed_at", nullable = false)
    open var closedAt: String = "",

    @Column(name = "total_cards", nullable = false)
    open var totalCards: Int = 0,

    @Column(name = "total_votes", nullable = false)
    open var totalVotes: Int = 0,

    @Column(name = "total_participants", nullable = false)
    open var totalParticipants: Int = 0,

    @Column(name = "action_items_total", nullable = false)
    open var actionItemsTotal: Int = 0,

    @Column(name = "action_items_done", nullable = false)
    open var actionItemsDone: Int = 0,

    @Column(name = "snapshot_data", nullable = false)
    open var snapshotData: String = "{}",

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = Instant.now().toString()
) {
    companion object {
        fun create(
            boardId: String,
            teamName: String,
            framework: String,
            closedAt: String,
            totalCards: Int,
            totalVotes: Int,
            totalParticipants: Int,
            actionItemsTotal: Int,
            actionItemsDone: Int,
            snapshotData: String
        ): BoardSnapshot {
            return BoardSnapshot(
                boardId = boardId,
                teamName = teamName,
                framework = framework,
                closedAt = closedAt,
                totalCards = totalCards,
                totalVotes = totalVotes,
                totalParticipants = totalParticipants,
                actionItemsTotal = actionItemsTotal,
                actionItemsDone = actionItemsDone,
                snapshotData = snapshotData
            )
        }
    }
}
