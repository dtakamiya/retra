package com.retra.icebreaker.usecase

import com.retra.board.domain.BoardRepository
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetIcebreakerUseCase(
    private val boardRepository: BoardRepository,
    private val answerRepository: IcebreakerAnswerRepository
) {
    @Transactional(readOnly = true)
    fun execute(slug: String): IcebreakerResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val answers = answerRepository.findByBoardId(board.id)
        val participantMap = board.participants.associateBy { it.id }

        return IcebreakerResponse(
            question = board.icebreakerQuestion,
            answers = answers.map { answer ->
                val participant = participantMap[answer.participantId]
                    ?: throw NotFoundException("Participant not found")
                IcebreakerMapper.toAnswerResponse(answer, participant)
            }
        )
    }
}
