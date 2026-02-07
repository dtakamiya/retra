package com.retra.card.usecase

import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.card.domain.Memo
import com.retra.card.domain.MemoRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CreateMemoUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val memoRepository: MemoRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, cardId: String, request: CreateMemoRequest): MemoResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found: $slug")

        if (!board.phase.canCreateMemo()) {
            throw BadRequestException("Memos can only be created during DISCUSSION or ACTION_ITEMS phase")
        }

        if (request.content.isBlank()) {
            throw BadRequestException("Memo content must not be empty")
        }
        if (request.content.length > 2000) {
            throw BadRequestException("Memo content must not exceed 2000 characters")
        }

        val card = cardRepository.findById(cardId)
            ?: throw NotFoundException("Card not found")

        if (card.board?.id != board.id) {
            throw BadRequestException("Card does not belong to this board")
        }

        val participant = board.findParticipantById(request.participantId)

        val memo = Memo.create(
            card = card,
            board = board,
            content = request.content,
            author = participant
        )

        memoRepository.save(memo)

        eventPublisher.publishAll(memo.getDomainEvents())
        memo.clearDomainEvents()

        return MemoMapper.toMemoResponse(memo)
    }
}
