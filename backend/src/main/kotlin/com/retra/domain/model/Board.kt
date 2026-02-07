package com.retra.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

enum class Framework {
    KPT, FUN_DONE_LEARN, FOUR_LS, START_STOP_CONTINUE
}

enum class Phase {
    WRITING, VOTING, DISCUSSION, ACTION_ITEMS, CLOSED
}

@Entity
@Table(name = "boards")
open class Board(
    @Id
    open var id: String = UUID.randomUUID().toString(),

    @Column(nullable = false, unique = true)
    open var slug: String = "",

    @Column(nullable = false)
    open var title: String = "",

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    open var framework: Framework = Framework.KPT,

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    open var phase: Phase = Phase.WRITING,

    @Column(name = "max_votes_per_person", nullable = false)
    open var maxVotesPerPerson: Int = 5,

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = Instant.now().toString(),

    @Column(name = "updated_at", nullable = false)
    open var updatedAt: String = Instant.now().toString(),

    @OneToMany(mappedBy = "board", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    open var columns: MutableList<BoardColumn> = mutableListOf(),

    @OneToMany(mappedBy = "board", cascade = [CascadeType.ALL], orphanRemoval = true)
    open var participants: MutableList<Participant> = mutableListOf(),

    @OneToMany(mappedBy = "board", cascade = [CascadeType.ALL], orphanRemoval = true)
    open var cards: MutableList<Card> = mutableListOf()
)
