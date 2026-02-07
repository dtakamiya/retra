package com.retra.domain.model

import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(name = "columns")
open class BoardColumn(
    @Id
    open var id: String = UUID.randomUUID().toString(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    open var board: Board? = null,

    @Column(nullable = false)
    open var name: String = "",

    @Column(name = "sort_order", nullable = false)
    open var sortOrder: Int = 0,

    @Column(nullable = false)
    open var color: String = "#6366f1",

    @OneToMany(mappedBy = "column", cascade = [CascadeType.ALL], orphanRemoval = true)
    open var cards: MutableList<Card> = mutableListOf()
)
