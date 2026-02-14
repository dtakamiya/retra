package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItem
import com.retra.actionitem.domain.ActionItemPriority
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CreateActionItemUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val actionItemRepository: ActionItemRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, request: CreateActionItemRequest): ActionItemResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canCreateActionItem()) {
            throw BadRequestException("Action items can only be created during ACTION_ITEMS phase")
        }

        if (request.content.isBlank()) {
            throw BadRequestException("Action item content must not be empty")
        }
        if (request.content.length > 2000) {
            throw BadRequestException("Action item content must not exceed 2000 characters")
        }

        board.findParticipantById(request.participantId)

        val card = if (request.cardId != null) {
            val found = cardRepository.findById(request.cardId)
                ?: throw NotFoundException("Card not found")
            if (found.board?.id != board.id) {
                throw BadRequestException("Card does not belong to this board")
            }
            found
        } else {
            null
        }

        val assignee = if (request.assigneeId != null) {
            board.findParticipantById(request.assigneeId)
        } else {
            null
        }

        val sortOrder = actionItemRepository.countByBoardId(board.id)

        val priority = try {
            ActionItemPriority.valueOf(request.priority.uppercase())
        } catch (e: IllegalArgumentException) {
            throw BadRequestException("Invalid priority: ${request.priority}. Must be one of: HIGH, MEDIUM, LOW")
        }

        val actionItem = ActionItem.create(
            board = board,
            card = card,
            content = request.content,
            assignee = assignee,
            dueDate = request.dueDate,
            sortOrder = sortOrder,
            priority = priority
        )

        actionItemRepository.save(actionItem)

        eventPublisher.publishAll(actionItem.getDomainEvents())
        actionItem.clearDomainEvents()

        return ActionItemMapper.toActionItemResponse(actionItem)
    }
}
