package com.retra.card.domain

import com.retra.board.domain.Board
import com.retra.board.domain.Participant
import com.retra.shared.domain.AggregateRoot
import com.retra.shared.domain.ForbiddenException
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "memos")
open class Memo(
    @Id
    open var id: String = UUID.randomUUID().toString(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    open var card: Card? = null,

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
    open var updatedAt: String = Instant.now().toString()
) : AggregateRoot() {

    fun updateContent(newContent: String, executorId: String) {
        if (participant?.id != executorId) {
            throw ForbiddenException("Only the author can edit this memo")
        }
        content = newContent
        updatedAt = Instant.now().toString()
        registerEvent(
            MemoEvent.MemoUpdated(
                boardSlug = board?.slug ?: throw IllegalStateException("Memo must belong to a board"),
                cardId = card?.id ?: throw IllegalStateException("Memo must belong to a card"),
                memoId = id,
                content = content,
                authorNickname = authorNickname,
                participantId = participant?.id,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
        )
    }

    fun canBeDeletedBy(executor: Participant): Boolean {
        return participant?.id == executor.id || executor.isFacilitator
    }

    companion object {
        fun create(
            card: Card,
            board: Board,
            content: String,
            author: Participant
        ): Memo {
            val now = Instant.now().toString()
            val memo = Memo(
                id = UUID.randomUUID().toString(),
                card = card,
                board = board,
                content = content,
                authorNickname = author.nickname,
                participant = author,
                createdAt = now,
                updatedAt = now
            )
            memo.registerEvent(
                MemoEvent.MemoCreated(
                    boardSlug = board.slug,
                    cardId = card.id,
                    memoId = memo.id,
                    content = content,
                    authorNickname = author.nickname,
                    participantId = author.id,
                    createdAt = now,
                    updatedAt = now
                )
            )
            return memo
        }
    }
}
