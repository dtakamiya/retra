package com.retra.kudos.usecase

import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.Kudos
import com.retra.kudos.domain.KudosCategory
import com.retra.kudos.domain.KudosEvent
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.EnumParser
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

        val sender = board.findParticipantById(request.senderId)
        val receiver = board.findParticipantById(request.receiverId)

        val category = EnumParser.parse<KudosCategory>(request.category, "kudos category")

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
