package com.retra.history.usecase

import com.fasterxml.jackson.databind.ObjectMapper
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
    private val actionItemRepository: ActionItemRepository,
    private val objectMapper: ObjectMapper
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
            teamName = board.teamName ?: board.title,
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
        val data = mapOf(
            "columns" to board.columns.sortedBy { it.sortOrder }.map { column ->
                mapOf(
                    "name" to column.name,
                    "cards" to cards.filter { it.column?.id == column.id }
                        .sortedBy { it.sortOrder }
                        .map { mapOf("content" to it.content, "votes" to it.votes.size) }
                )
            }
        )
        return objectMapper.writeValueAsString(data)
    }
}
