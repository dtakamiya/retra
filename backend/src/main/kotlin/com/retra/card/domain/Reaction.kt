package com.retra.card.domain

import com.retra.board.domain.Board
import com.retra.board.domain.Participant
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "reactions",
    uniqueConstraints = [UniqueConstraint(columnNames = ["card_id", "participant_id", "emoji"])]
)
open class Reaction(
    @Id
    open var id: String = UUID.randomUUID().toString(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    open var card: Card? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    open var board: Board? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    open var participant: Participant? = null,

    @Column(nullable = false)
    open var emoji: String = "",

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = Instant.now().toString()
)
