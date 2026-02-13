package com.retra.history.usecase

import com.retra.history.domain.BoardSnapshotRepository
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service

@Service
class GetSnapshotUseCase(
    private val snapshotRepository: BoardSnapshotRepository
) {

    fun execute(snapshotId: String): SnapshotDetailResponse {
        val snapshot = snapshotRepository.findById(snapshotId)
            ?: throw NotFoundException("スナップショットが見つかりません")
        return SnapshotMapper.toDetail(snapshot)
    }
}
