package com.retra.history.usecase

import com.retra.history.domain.BoardSnapshotRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetTeamHistoryUseCase(
    private val snapshotRepository: BoardSnapshotRepository
) {

    @Transactional(readOnly = true)
    fun getHistory(teamName: String?, page: Int = 0, size: Int = 10): PagedSnapshotResponse {
        val snapshots = if (teamName != null) {
            snapshotRepository.findByTeamNameOrderByClosedAtDesc(teamName, page, size)
        } else {
            snapshotRepository.findAllOrderByClosedAtDesc(page, size)
        }
        val totalElements = if (teamName != null) {
            snapshotRepository.countByTeamName(teamName)
        } else {
            snapshotRepository.countAll()
        }
        val totalPages = if (size > 0) ((totalElements + size - 1) / size).toInt() else 0
        return PagedSnapshotResponse(
            content = snapshots.map { SnapshotMapper.toSummary(it) },
            totalElements = totalElements,
            totalPages = totalPages,
            currentPage = page,
            pageSize = size
        )
    }

    @Transactional(readOnly = true)
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
