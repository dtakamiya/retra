package com.retra.kudos.domain

import com.retra.board.domain.Board
import com.retra.board.domain.Participant
import com.retra.shared.domain.BadRequestException
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "kudos")
open class Kudos(
    @Id
    open var id: String = "",

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    open var board: Board? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    open var sender: Participant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    open var receiver: Participant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    open var category: KudosCategory = KudosCategory.GREAT_JOB,

    @Column(name = "message")
    open var message: String? = null,

    @Column(name = "created_at")
    open var createdAt: String = ""
) {
    companion object {
        private const val MAX_MESSAGE_LENGTH = 140

        fun create(
            board: Board,
            sender: Participant,
            receiver: Participant,
            category: KudosCategory,
            message: String?
        ): Kudos {
            if (sender.id == receiver.id) {
                throw BadRequestException("Cannot send kudos to yourself")
            }
            if (message != null && message.length > MAX_MESSAGE_LENGTH) {
                throw BadRequestException("Message must be $MAX_MESSAGE_LENGTH characters or less")
            }
            return Kudos(
                id = UUID.randomUUID().toString(),
                board = board,
                sender = sender,
                receiver = receiver,
                category = category,
                message = message?.trim()?.ifEmpty { null },
                createdAt = Instant.now().toString()
            )
        }
    }
}
