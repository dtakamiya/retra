package com.retra.history.usecase

import com.retra.history.domain.BoardSnapshotRepository
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DeleteSnapshotUseCase(
    private val snapshotRepository: BoardSnapshotRepository
) {

    @Transactional
    fun execute(id: String, teamName: String) {
        val snapshot = snapshotRepository.findById(id)
            ?: throw NotFoundException("Snapshot not found")
        if (snapshot.teamName != teamName) {
            throw ForbiddenException("Cannot delete snapshot from another team")
        }
        snapshotRepository.deleteById(id)
    }
}
