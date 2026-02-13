package com.retra.history.usecase

import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.Board
import com.retra.card.domain.Card
import com.retra.history.domain.BoardSnapshot
import com.retra.history.domain.BoardSnapshotRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class CreateSnapshotUseCase(
    private val snapshotRepository: BoardSnapshotRepository,
    private val actionItemRepository: ActionItemRepository
) {

    @Transactional
    fun execute(board: Board) {
        val cards = board.cards
        val totalCards = cards.size
        val totalVotes = cards.sumOf { it.votes.size }
        val totalParticipants = board.participants.size

        val actionItems = actionItemRepository.findByBoardId(board.id)
        val actionItemsTotal = actionItems.size
        val actionItemsDone = actionItems.count { it.status == ActionItemStatus.DONE }

        val snapshotData = buildSnapshotJson(board, cards)

        val snapshot = BoardSnapshot.create(
            boardId = board.id,
            teamName = board.title,
            framework = board.framework.name,
            closedAt = Instant.now().toString(),
            totalCards = totalCards,
            totalVotes = totalVotes,
            totalParticipants = totalParticipants,
            actionItemsTotal = actionItemsTotal,
            actionItemsDone = actionItemsDone,
            snapshotData = snapshotData
        )
        snapshotRepository.save(snapshot)
    }

    private fun buildSnapshotJson(board: Board, cards: List<Card>): String {
        val cardsByColumnId = cards.groupBy { it.column?.id ?: "" }
        val columnsJson = board.columns.sortedBy { it.sortOrder }.joinToString(",") { column ->
            val columnCards = cardsByColumnId[column.id] ?: emptyList()
            val cardsJson = columnCards.sortedBy { it.sortOrder }.joinToString(",") { card ->
                """{"content":${escapeJson(card.content)},"votes":${card.votes.size}}"""
            }
            """{"name":${escapeJson(column.name)},"cards":[$cardsJson]}"""
        }
        return """{"columns":[$columnsJson]}"""
    }

    private fun escapeJson(value: String): String {
        val escaped = value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
        return "\"$escaped\""
    }
}
