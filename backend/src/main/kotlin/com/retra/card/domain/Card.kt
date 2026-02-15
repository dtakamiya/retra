package com.retra.card.domain

import com.retra.shared.domain.AggregateRoot
import com.retra.shared.domain.ConflictException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.Board
import com.retra.board.domain.BoardColumn
import com.retra.board.domain.Participant
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

    @Column(name = "sort_order", nullable = false)
    open var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = Instant.now().toString(),

    @Column(name = "updated_at", nullable = false)
    open var updatedAt: String = Instant.now().toString(),

    @Column(name = "is_discussed", nullable = false)
    open var isDiscussed: Boolean = false,

    @Column(name = "discussion_order", nullable = false)
    open var discussionOrder: Int = 0,

    @OneToMany(mappedBy = "card", cascade = [CascadeType.ALL], orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    open var votes: MutableList<Vote> = mutableListOf(),

    @OneToMany(mappedBy = "card", cascade = [CascadeType.ALL], orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    open var memos: MutableList<Memo> = mutableListOf(),

    @OneToMany(mappedBy = "card", cascade = [CascadeType.ALL], orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    open var reactions: MutableList<Reaction> = mutableListOf()
) : AggregateRoot() {

    fun updateContent(newContent: String, executorId: String) {
        if (participant?.id != executorId) {
            throw ForbiddenException("Only the author can edit this card")
        }
        content = newContent
        updatedAt = Instant.now().toString()
        registerEvent(
            CardEvent.CardUpdated(
                boardSlug = board?.slug ?: throw IllegalStateException("Card must belong to a board"),
                cardId = id,
                columnId = column?.id ?: throw IllegalStateException("Card must belong to a column"),
                content = content,
                authorNickname = authorNickname,
                participantId = participant?.id,
                voteCount = votes.size,
                sortOrder = sortOrder,
                isAnonymous = board?.isAnonymous ?: false,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
        )
    }

    fun moveTo(targetColumn: BoardColumn, newSortOrder: Int) {
        val sourceColumnId = column?.id ?: ""
        column = targetColumn
        sortOrder = newSortOrder
        updatedAt = Instant.now().toString()
        registerEvent(
            CardEvent.CardMoved(
                boardSlug = board?.slug ?: throw IllegalStateException("Card must belong to a board"),
                cardId = id,
                sourceColumnId = sourceColumnId,
                targetColumnId = targetColumn.id,
                sortOrder = newSortOrder
            )
        )
    }

    fun markAsDiscussed(): CardEvent.CardDiscussionMarked {
        this.isDiscussed = true
        this.updatedAt = Instant.now().toString()
        val boardSlug = board?.slug ?: throw IllegalStateException("Card must belong to a board")
        return CardEvent.CardDiscussionMarked(
            boardSlug = boardSlug,
            cardId = id,
            isDiscussed = true,
            discussionOrder = discussionOrder
        )
    }

    fun unmarkAsDiscussed(): CardEvent.CardDiscussionMarked {
        this.isDiscussed = false
        this.updatedAt = Instant.now().toString()
        val boardSlug = board?.slug ?: throw IllegalStateException("Card must belong to a board")
        return CardEvent.CardDiscussionMarked(
            boardSlug = boardSlug,
            cardId = id,
            isDiscussed = false,
            discussionOrder = discussionOrder
        )
    }

    fun addVote(voter: Participant): Vote {
        val existing = votes.find { it.participant?.id == voter.id }
        if (existing != null) {
            throw ConflictException("Already voted on this card")
        }
        val vote = Vote(
            id = UUID.randomUUID().toString(),
            card = this,
            participant = voter,
            createdAt = Instant.now().toString()
        )
        votes.add(vote)
        return vote
    }

    fun removeVote(voterId: String): Vote {
        val vote = votes.find { it.participant?.id == voterId }
            ?: throw NotFoundException("Vote not found")
        votes.remove(vote)
        return vote
    }

    companion object {
        fun create(
            board: Board,
            column: BoardColumn,
            content: String,
            author: Participant,
            sortOrder: Int
        ): Card {
            val now = Instant.now().toString()
            val card = Card(
                id = UUID.randomUUID().toString(),
                column = column,
                board = board,
                content = content,
                authorNickname = author.nickname,
                participant = author,
                sortOrder = sortOrder,
                createdAt = now,
                updatedAt = now
            )
            card.registerEvent(
                CardEvent.CardCreated(
                    boardSlug = board.slug,
                    cardId = card.id,
                    columnId = column.id,
                    content = content,
                    authorNickname = author.nickname,
                    participantId = author.id,
                    voteCount = 0,
                    sortOrder = sortOrder,
                    isAnonymous = board.isAnonymous,
                    createdAt = now,
                    updatedAt = now
                )
            )
            return card
        }
    }
}
