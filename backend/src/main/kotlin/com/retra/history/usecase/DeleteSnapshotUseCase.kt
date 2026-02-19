package com.retra.history.usecase

import com.retra.history.domain.BoardSnapshotRepository
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DeleteSnapshotUseCase(
    private val snapshotRepository: BoardSnapshotRepository
) {

    @Transactional
    fun execute(id: String) {
        if (!snapshotRepository.existsById(id)) {
            throw NotFoundException("スナップショットが見つかりません")
        }
        snapshotRepository.deleteById(id)
    }
}
