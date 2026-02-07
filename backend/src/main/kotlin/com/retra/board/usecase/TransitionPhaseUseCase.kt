package com.retra.board.usecase

import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TransitionPhaseUseCase(
    private val boardRepository: BoardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, request: ChangePhaseRequest): BoardResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        board.transitionPhase(request.phase, request.participantId)
        boardRepository.save(board)

        eventPublisher.publishAll(board.getDomainEvents())
        board.clearDomainEvents()

        return BoardMapper.toBoardResponse(board)
    }
}
