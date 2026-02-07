package com.retra.service

import com.retra.domain.model.*
import com.retra.domain.repository.BoardColumnRepository
import com.retra.domain.repository.BoardRepository
import com.retra.dto.*
import com.retra.exception.BadRequestException
import com.retra.exception.ForbiddenException
import com.retra.exception.NotFoundException
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.Instant
import java.util.UUID

@Service
class BoardService(
    private val boardRepository: BoardRepository,
    private val columnRepository: BoardColumnRepository,
    private val eventPublisher: ApplicationEventPublisher
) {

    companion object {
        private const val SLUG_CHARS = "abcdefghijkmnpqrstuvwxyz23456789"
        private const val SLUG_LENGTH = 8
        private val random = SecureRandom()
    }

    @Transactional
    fun createBoard(request: CreateBoardRequest): BoardResponse {
        val slug = generateSlug()
        val now = Instant.now().toString()

        val board = Board(
            id = UUID.randomUUID().toString(),
            slug = slug,
            title = request.title,
            framework = request.framework,
            maxVotesPerPerson = request.maxVotesPerPerson,
            createdAt = now,
            updatedAt = now
        )
        boardRepository.save(board)

        val columns = createColumnsForFramework(board, request.framework)
        columns.forEach { columnRepository.save(it) }
        board.columns.addAll(columns)

        return toResponse(board)
    }

    @Transactional(readOnly = true)
    fun getBoard(slug: String): BoardResponse {
        val board = findBoardBySlug(slug)
        return toResponse(board)
    }

    @Transactional
    fun changePhase(slug: String, request: ChangePhaseRequest): BoardResponse {
        val board = findBoardBySlug(slug)

        val participant = board.participants.find { it.id == request.participantId }
            ?: throw NotFoundException("Participant not found")

        if (!participant.isFacilitator) {
            throw ForbiddenException("Only facilitator can change phase")
        }

        validatePhaseTransition(board.phase, request.phase)
        board.phase = request.phase
        board.updatedAt = Instant.now().toString()
        boardRepository.save(board)

        eventPublisher.publishEvent(PhaseChangedEvent(slug, request.phase))

        return toResponse(board)
    }

    @Transactional(readOnly = true)
    fun findBoardBySlug(slug: String): Board {
        return boardRepository.findBySlug(slug)
            .orElseThrow { NotFoundException("Board not found: $slug") }
    }

    private fun validatePhaseTransition(current: Phase, next: Phase) {
        val validTransitions = mapOf(
            Phase.WRITING to Phase.VOTING,
            Phase.VOTING to Phase.DISCUSSION,
            Phase.DISCUSSION to Phase.ACTION_ITEMS,
            Phase.ACTION_ITEMS to Phase.CLOSED
        )

        if (validTransitions[current] != next) {
            throw BadRequestException("Invalid phase transition: $current -> $next")
        }
    }

    private fun createColumnsForFramework(board: Board, framework: Framework): List<BoardColumn> {
        val columnDefs = when (framework) {
            Framework.KPT -> listOf(
                Triple("Keep", 0, "#22c55e"),
                Triple("Problem", 1, "#ef4444"),
                Triple("Try", 2, "#3b82f6")
            )
            Framework.FUN_DONE_LEARN -> listOf(
                Triple("Fun", 0, "#f59e0b"),
                Triple("Done", 1, "#22c55e"),
                Triple("Learn", 2, "#8b5cf6")
            )
            Framework.FOUR_LS -> listOf(
                Triple("Liked", 0, "#22c55e"),
                Triple("Learned", 1, "#3b82f6"),
                Triple("Lacked", 2, "#ef4444"),
                Triple("Longed For", 3, "#f59e0b")
            )
            Framework.START_STOP_CONTINUE -> listOf(
                Triple("Start", 0, "#22c55e"),
                Triple("Stop", 1, "#ef4444"),
                Triple("Continue", 2, "#3b82f6")
            )
        }

        return columnDefs.map { (name, order, color) ->
            BoardColumn(
                id = UUID.randomUUID().toString(),
                board = board,
                name = name,
                sortOrder = order,
                color = color
            )
        }
    }

    private fun generateSlug(): String {
        var slug: String
        do {
            slug = (1..SLUG_LENGTH)
                .map { SLUG_CHARS[random.nextInt(SLUG_CHARS.length)] }
                .joinToString("")
        } while (boardRepository.existsBySlug(slug))
        return slug
    }

    fun toResponse(board: Board): BoardResponse {
        return BoardResponse(
            id = board.id,
            slug = board.slug,
            title = board.title,
            framework = board.framework,
            phase = board.phase,
            maxVotesPerPerson = board.maxVotesPerPerson,
            columns = board.columns.map { col ->
                ColumnResponse(
                    id = col.id,
                    name = col.name,
                    sortOrder = col.sortOrder,
                    color = col.color,
                    cards = col.cards.sortedBy { it.sortOrder }.map { card ->
                        CardResponse(
                            id = card.id,
                            columnId = col.id,
                            content = card.content,
                            authorNickname = card.authorNickname,
                            participantId = card.participant?.id,
                            voteCount = card.votes.size,
                            sortOrder = card.sortOrder,
                            createdAt = card.createdAt,
                            updatedAt = card.updatedAt
                        )
                    }
                )
            },
            participants = board.participants.map { p ->
                ParticipantResponse(
                    id = p.id,
                    nickname = p.nickname,
                    isFacilitator = p.isFacilitator,
                    isOnline = p.isOnline,
                    createdAt = p.createdAt
                )
            },
            createdAt = board.createdAt,
            updatedAt = board.updatedAt
        )
    }
}

// Spring Application Events
data class PhaseChangedEvent(val slug: String, val phase: Phase)
data class CardCreatedEvent(val slug: String, val card: CardResponse)
data class CardUpdatedEvent(val slug: String, val card: CardResponse)
data class CardDeletedEvent(val slug: String, val cardId: String, val columnId: String)
data class VoteAddedEvent(val slug: String, val vote: VoteResponse)
data class VoteRemovedEvent(val slug: String, val cardId: String, val participantId: String)
data class ParticipantJoinedEvent(val slug: String, val participant: ParticipantResponse)
data class ParticipantOnlineEvent(val slug: String, val participantId: String, val isOnline: Boolean)
data class CardMovedEvent(
    val slug: String,
    val cardId: String,
    val sourceColumnId: String,
    val targetColumnId: String,
    val sortOrder: Int
)
