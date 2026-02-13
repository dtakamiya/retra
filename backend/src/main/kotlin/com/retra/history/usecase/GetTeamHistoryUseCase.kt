package com.retra.history.usecase

import com.retra.history.domain.BoardSnapshotRepository
import org.springframework.stereotype.Service

@Service
class GetTeamHistoryUseCase(
    private val snapshotRepository: BoardSnapshotRepository
) {

    fun getHistory(teamName: String?): List<SnapshotSummaryResponse> {
        val snapshots = if (teamName != null) {
            snapshotRepository.findByTeamNameOrderByClosedAtDesc(teamName)
        } else {
            snapshotRepository.findAllOrderByClosedAtDesc()
        }
        return snapshots.map { SnapshotMapper.toSummary(it) }
    }

    fun getTrends(teamName: String?): TrendDataResponse {
        val snapshots = if (teamName != null) {
            snapshotRepository.findByTeamNameOrderByClosedAtDesc(teamName)
        } else {
            snapshotRepository.findAllOrderByClosedAtDesc()
        }
        return TrendDataResponse(
            snapshots = snapshots.reversed().map { SnapshotMapper.toTrendPoint(it) }
        )
    }
}
