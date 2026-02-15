package com.retra.card.usecase

import com.retra.board.domain.BoardRepository
import com.retra.card.domain.MemoEvent
import com.retra.card.domain.MemoRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DeleteMemoUseCase(
    private val boardRepository: BoardRepository,
    private val memoRepository: MemoRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, cardId: String, memoId: String, request: DeleteMemoRequest) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canCreateMemo()) {
            throw BadRequestException("Memos can only be deleted during DISCUSSION or ACTION_ITEMS phase")
        }

        val memo = memoRepository.findById(memoId)
            ?: throw NotFoundException("Memo not found")

        if (memo.card?.id != cardId || memo.board?.id != board.id) {
            throw BadRequestException("Memo does not belong to this card")
        }

        val participant = board.findParticipantById(request.participantId)

        if (!memo.canBeDeletedBy(participant)) {
            throw ForbiddenException("Only the author or facilitator can delete this memo")
        }

        memoRepository.delete(memo)

        eventPublisher.publish(MemoEvent.MemoDeleted(boardSlug = slug, cardId = cardId, memoId = memoId))
    }
}
