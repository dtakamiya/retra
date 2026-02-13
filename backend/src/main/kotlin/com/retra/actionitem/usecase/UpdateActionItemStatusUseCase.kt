package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UpdateActionItemStatusUseCase(
    private val boardRepository: BoardRepository,
    private val actionItemRepository: ActionItemRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, actionItemId: String, request: UpdateActionItemStatusRequest): ActionItemResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canCreateActionItem()) {
            throw BadRequestException("Action item status can only be changed during ACTION_ITEMS phase")
        }

        val actionItem = actionItemRepository.findById(actionItemId)
            ?: throw NotFoundException("Action item not found")

        if (actionItem.board?.id != board.id) {
            throw BadRequestException("Action item does not belong to this board")
        }

        val executor = board.findParticipantById(request.participantId)

        val newStatus = try {
            ActionItemStatus.valueOf(request.status)
        } catch (_: IllegalArgumentException) {
            throw BadRequestException("Invalid status: ${request.status}. Valid values: ${ActionItemStatus.entries.joinToString()}")
        }

        actionItem.changeStatus(newStatus, executor)
        actionItemRepository.save(actionItem)

        eventPublisher.publishAll(actionItem.getDomainEvents())
        actionItem.clearDomainEvents()

        return ActionItemMapper.toActionItemResponse(actionItem)
    }
}
