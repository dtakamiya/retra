package com.retra.kudos.usecase

import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.KudosEvent
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DeleteKudosUseCase(
    private val boardRepository: BoardRepository,
    private val kudosRepository: KudosRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, kudosId: String, participantId: String) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val kudos = kudosRepository.findById(kudosId)
            ?: throw NotFoundException("Kudos not found")

        if (kudos.board?.id != board.id) {
            throw NotFoundException("Kudos not found")
        }

        if (kudos.sender?.id != participantId) {
            throw ForbiddenException("Only the sender can delete kudos")
        }

        kudosRepository.delete(kudos)

        eventPublisher.publish(
            KudosEvent.KudosDeleted(
                boardSlug = slug,
                kudosId = kudosId
            )
        )
    }
}
