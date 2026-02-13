package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItemEvent
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.board.domain.BoardRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DeleteActionItemUseCase(
    private val boardRepository: BoardRepository,
    private val actionItemRepository: ActionItemRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, actionItemId: String, request: DeleteActionItemRequest) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canCreateActionItem()) {
            throw BadRequestException("Action items can only be deleted during ACTION_ITEMS phase")
        }

        val actionItem = actionItemRepository.findById(actionItemId)
            ?: throw NotFoundException("Action item not found")

        if (actionItem.board?.id != board.id) {
            throw BadRequestException("Action item does not belong to this board")
        }

        val participant = board.findParticipantById(request.participantId)

        if (!actionItem.canBeDeletedBy(participant)) {
            throw ForbiddenException("Only the facilitator or assignee can delete this action item")
        }

        actionItemRepository.delete(actionItem)

        eventPublisher.publish(ActionItemEvent.ActionItemDeleted(actionItemId, slug))
    }
}
