package com.retra.board.usecase

import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetBoardUseCase(
    private val boardRepository: BoardRepository
) {

    @Transactional(readOnly = true)
    fun execute(slug: String, requesterId: String? = null): BoardResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")
        return BoardMapper.toBoardResponse(board, requesterId)
    }
}
