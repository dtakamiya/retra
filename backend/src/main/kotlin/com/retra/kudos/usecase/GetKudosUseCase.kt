package com.retra.kudos.usecase

import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetKudosUseCase(
    private val boardRepository: BoardRepository,
    private val kudosRepository: KudosRepository
) {
    @Transactional(readOnly = true)
    fun execute(slug: String): List<KudosResponse> {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        return kudosRepository.findByBoardId(board.id).map { KudosMapper.toResponse(it) }
    }
}
