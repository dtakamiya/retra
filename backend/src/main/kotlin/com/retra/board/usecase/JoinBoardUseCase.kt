package com.retra.board.usecase

import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class JoinBoardUseCase(
    private val boardRepository: BoardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, request: JoinBoardRequest): ParticipantResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        val participant = board.addParticipant(request.nickname)
        boardRepository.save(board)

        eventPublisher.publishAll(board.getDomainEvents())
        board.clearDomainEvents()

        return BoardMapper.toParticipantResponse(participant)
    }
}
