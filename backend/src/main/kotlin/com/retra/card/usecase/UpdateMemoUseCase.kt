package com.retra.card.usecase

import com.retra.board.domain.BoardRepository
import com.retra.card.domain.MemoRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UpdateMemoUseCase(
    private val boardRepository: BoardRepository,
    private val memoRepository: MemoRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, cardId: String, memoId: String, request: UpdateMemoRequest): MemoResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canCreateMemo()) {
            throw BadRequestException("Memos can only be edited during DISCUSSION or ACTION_ITEMS phase")
        }

        if (request.content.isBlank()) {
            throw BadRequestException("Memo content must not be empty")
        }
        if (request.content.length > 2000) {
            throw BadRequestException("Memo content must not exceed 2000 characters")
        }

        val memo = memoRepository.findById(memoId)
            ?: throw NotFoundException("Memo not found")

        if (memo.card?.id != cardId || memo.board?.id != board.id) {
            throw BadRequestException("Memo does not belong to this card")
        }

        memo.updateContent(request.content, request.participantId)
        memoRepository.save(memo)

        eventPublisher.publishAll(memo.getDomainEvents())
        memo.clearDomainEvents()

        return MemoMapper.toMemoResponse(memo)
    }
}
