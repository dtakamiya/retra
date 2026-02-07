package com.retra.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "participants")
open class Participant(
    @Id
    open var id: String = UUID.randomUUID().toString(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    open var board: Board? = null,

    @Column(nullable = false)
    open var nickname: String = "",

    @Column(name = "session_id")
    open var sessionId: String? = null,

    @Column(name = "is_facilitator", nullable = false)
    open var isFacilitator: Boolean = false,

    @Column(name = "is_online", nullable = false)
    open var isOnline: Boolean = false,

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = Instant.now().toString()
)
