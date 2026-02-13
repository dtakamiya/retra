package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItemRepository
import com.retra.board.domain.BoardRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UpdateActionItemUseCase(
    private val boardRepository: BoardRepository,
    private val actionItemRepository: ActionItemRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, actionItemId: String, request: UpdateActionItemRequest): ActionItemResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canCreateActionItem()) {
            throw BadRequestException("Action items can only be edited during ACTION_ITEMS phase")
        }

        if (request.content.isBlank()) {
            throw BadRequestException("Action item content must not be empty")
        }
        if (request.content.length > 2000) {
            throw BadRequestException("Action item content must not exceed 2000 characters")
        }

        val actionItem = actionItemRepository.findById(actionItemId)
            ?: throw NotFoundException("Action item not found")

        if (actionItem.board?.id != board.id) {
            throw BadRequestException("Action item does not belong to this board")
        }

        val executor = board.findParticipantById(request.participantId)

        val assignee = if (request.assigneeId != null) {
            board.findParticipantById(request.assigneeId)
        } else {
            null
        }

        actionItem.update(request.content, assignee, request.dueDate, executor)
        actionItemRepository.save(actionItem)

        eventPublisher.publishAll(actionItem.getDomainEvents())
        actionItem.clearDomainEvents()

        return ActionItemMapper.toActionItemResponse(actionItem)
    }
}
