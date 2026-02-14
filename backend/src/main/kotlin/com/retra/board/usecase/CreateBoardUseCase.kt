package com.retra.board.usecase

import com.retra.board.domain.Board
import com.retra.board.domain.BoardRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CreateBoardUseCase(
    private val boardRepository: BoardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(request: CreateBoardRequest): BoardResponse {
        val board = Board.create(
            title = request.title,
            framework = request.framework,
            maxVotesPerPerson = request.maxVotesPerPerson,
            isAnonymous = request.isAnonymous,
            teamName = request.teamName
        )

        boardRepository.save(board)

        eventPublisher.publishAll(board.getDomainEvents())
        board.clearDomainEvents()

        return BoardMapper.toBoardResponse(board)
    }
}
