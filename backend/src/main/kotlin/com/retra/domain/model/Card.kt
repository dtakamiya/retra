package com.retra.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "cards")
open class Card(
    @Id
    open var id: String = UUID.randomUUID().toString(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    open var column: BoardColumn? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    open var board: Board? = null,

    @Column(nullable = false)
    open var content: String = "",

    @Column(name = "author_nickname")
    open var authorNickname: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id")
    open var participant: Participant? = null,

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = Instant.now().toString(),

    @Column(name = "updated_at", nullable = false)
    open var updatedAt: String = Instant.now().toString(),

    @OneToMany(mappedBy = "card", cascade = [CascadeType.ALL], orphanRemoval = true)
    open var votes: MutableList<Vote> = mutableListOf()
)
