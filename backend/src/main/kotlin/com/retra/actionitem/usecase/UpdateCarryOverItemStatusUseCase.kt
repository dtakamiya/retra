package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UpdateCarryOverItemStatusUseCase(
    private val boardRepository: BoardRepository,
    private val actionItemRepository: ActionItemRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, actionItemId: String, request: UpdateActionItemStatusRequest) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val participant = board.findParticipantById(request.participantId)
        if (!participant.isFacilitator) {
            throw ForbiddenException("Only facilitator can update carry-over item status")
        }

        val actionItem = actionItemRepository.findById(actionItemId)
            ?: throw NotFoundException("Action item not found")

        val newStatus = try {
            ActionItemStatus.valueOf(request.status)
        } catch (e: IllegalArgumentException) {
            throw BadRequestException("Invalid status: ${request.status}")
        }

        actionItem.status = newStatus
        actionItem.updatedAt = java.time.Instant.now().toString()
        actionItemRepository.save(actionItem)
    }
}
