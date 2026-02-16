package com.retra.kudos.usecase

import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.Kudos
import com.retra.kudos.domain.KudosCategory
import com.retra.kudos.domain.KudosEvent
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SendKudosUseCase(
    private val boardRepository: BoardRepository,
    private val kudosRepository: KudosRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, request: SendKudosRequest): KudosResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val sender = board.participants.find { it.id == request.senderId }
            ?: throw NotFoundException("Sender not found")
        val receiver = board.participants.find { it.id == request.receiverId }
            ?: throw NotFoundException("Receiver not found")

        val category = try {
            KudosCategory.valueOf(request.category)
        } catch (e: IllegalArgumentException) {
            throw BadRequestException("Invalid kudos category: ${request.category}")
        }

        val kudos = Kudos.create(board, sender, receiver, category, request.message)
        kudosRepository.save(kudos)

        val response = KudosMapper.toResponse(kudos)

        eventPublisher.publish(
            KudosEvent.KudosSent(
                boardSlug = slug,
                kudosId = kudos.id,
                senderId = sender.id,
                senderNickname = sender.nickname,
                receiverId = receiver.id,
                receiverNickname = receiver.nickname,
                category = category,
                message = kudos.message,
                createdAt = kudos.createdAt
            )
        )

        return response
    }
}
