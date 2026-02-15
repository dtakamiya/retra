package com.retra.board.domain

import com.retra.shared.domain.AggregateRoot
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.card.domain.Card
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

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

    @Column(name = "is_anonymous", nullable = false, updatable = false)
    open var isAnonymous: Boolean = false,

    @Column(name = "team_name")
    open var teamName: String? = null,

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = Instant.now().toString(),

    @Column(name = "updated_at", nullable = false)
    open var updatedAt: String = Instant.now().toString(),

    @OneToMany(mappedBy = "board", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @org.hibernate.annotations.BatchSize(size = 20)
    open var columns: MutableList<BoardColumn> = mutableListOf(),

    @OneToMany(mappedBy = "board", cascade = [CascadeType.ALL], orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    open var participants: MutableList<Participant> = mutableListOf(),

    @OneToMany(mappedBy = "board", cascade = [CascadeType.ALL], orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    open var cards: MutableList<Card> = mutableListOf()
) : AggregateRoot() {

    fun getVoteLimit(): VoteLimit = VoteLimit(maxVotesPerPerson)

    fun transitionPhase(targetPhase: Phase, executorId: String): Phase {
        val participant = findParticipantById(executorId)
        if (!participant.isFacilitator) {
            throw ForbiddenException("Only facilitator can change phase")
        }
        phase = phase.transitionTo(targetPhase)
        updatedAt = Instant.now().toString()
        registerEvent(BoardEvent.PhaseChanged(boardSlug = slug, phase = phase))
        return phase
    }

    fun addParticipant(nickname: String): Participant {
        val isFirst = participants.isEmpty()
        val participant = Participant(
            id = UUID.randomUUID().toString(),
            board = this,
            nickname = nickname,
            isFacilitator = isFirst,
            isOnline = true,
            createdAt = Instant.now().toString()
        )
        participants.add(participant)
        registerEvent(
            BoardEvent.ParticipantJoined(
                boardSlug = slug,
                participantId = participant.id,
                nickname = participant.nickname,
                isFacilitator = participant.isFacilitator
            )
        )
        return participant
    }

    fun findParticipantById(id: String): Participant {
        return participants.find { it.id == id }
            ?: throw NotFoundException("Participant not found")
    }

    fun findColumnById(id: String): BoardColumn {
        return columns.find { it.id == id }
            ?: throw NotFoundException("Column not found")
    }

    companion object {
        fun create(
            title: String,
            framework: Framework,
            maxVotesPerPerson: Int = 5,
            isAnonymous: Boolean = false,
            teamName: String? = null
        ): Board {
            val slug = BoardSlug.generate()
            val now = Instant.now().toString()
            val board = Board(
                id = UUID.randomUUID().toString(),
                slug = slug.value,
                title = title,
                framework = framework,
                maxVotesPerPerson = maxVotesPerPerson,
                isAnonymous = isAnonymous,
                teamName = teamName,
                createdAt = now,
                updatedAt = now
            )

            val columnDefs = framework.getColumnDefinitions()
            val boardColumns = columnDefs.map { def ->
                BoardColumn(
                    id = UUID.randomUUID().toString(),
                    board = board,
                    name = def.name,
                    sortOrder = def.sortOrder,
                    color = def.color
                )
            }
            board.columns.addAll(boardColumns)

            board.registerEvent(BoardEvent.BoardCreated(board.id, board.slug))
            return board
        }
    }
}
