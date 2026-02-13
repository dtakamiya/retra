package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItemRepository
import com.retra.board.domain.BoardRepository
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetActionItemsUseCase(
    private val boardRepository: BoardRepository,
    private val actionItemRepository: ActionItemRepository
) {

    @Transactional(readOnly = true)
    fun execute(slug: String): List<ActionItemResponse> {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        val actionItems = actionItemRepository.findByBoardId(board.id)

        return actionItems.map { ActionItemMapper.toActionItemResponse(it) }
    }
}
