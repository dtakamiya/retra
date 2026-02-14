package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetCarryOverItemsUseCase(
    private val boardRepository: BoardRepository,
    private val actionItemRepository: ActionItemRepository
) {
    @Transactional(readOnly = true)
    fun execute(slug: String): CarryOverItemsResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val teamName = board.teamName
            ?: return CarryOverItemsResponse(items = emptyList(), teamName = "")

        val closedBoards = boardRepository.findByTeamNameAndPhaseOrderByUpdatedAtDesc(teamName, Phase.CLOSED)
            .filter { it.id != board.id }

        if (closedBoards.isEmpty()) {
            return CarryOverItemsResponse(items = emptyList(), teamName = teamName)
        }

        val prevBoard = closedBoards.first()
        val actionItems = actionItemRepository.findByBoardId(prevBoard.id)
            .filter { it.status != ActionItemStatus.DONE }

        val items = actionItems.map { ai ->
            CarryOverItemResponse(
                id = ai.id,
                content = ai.content,
                assigneeNickname = ai.assignee?.nickname,
                dueDate = ai.dueDate,
                status = ai.status.name,
                priority = ai.priority.name,
                sourceBoardTitle = prevBoard.title,
                sourceBoardClosedAt = prevBoard.updatedAt,
                sourceBoardSlug = prevBoard.slug
            )
        }

        return CarryOverItemsResponse(items = items, teamName = teamName)
    }
}
