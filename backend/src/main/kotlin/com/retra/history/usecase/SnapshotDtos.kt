package com.retra.history.usecase

data class SnapshotSummaryResponse(
    val id: String,
    val teamName: String,
    val framework: String,
    val closedAt: String,
    val totalCards: Int,
    val totalVotes: Int,
    val totalParticipants: Int,
    val actionItemsTotal: Int,
    val actionItemsDone: Int
)

data class SnapshotDetailResponse(
    val id: String,
    val teamName: String,
    val framework: String,
    val closedAt: String,
    val totalCards: Int,
    val totalVotes: Int,
    val totalParticipants: Int,
    val actionItemsTotal: Int,
    val actionItemsDone: Int,
    val snapshotData: String
)

data class TrendDataResponse(
    val snapshots: List<TrendPoint>
)

data class PagedSnapshotResponse(
    val content: List<SnapshotSummaryResponse>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int,
    val pageSize: Int
)

data class TrendPoint(
    val closedAt: String,
    val totalCards: Int,
    val totalVotes: Int,
    val totalParticipants: Int,
    val actionItemsTotal: Int,
    val actionItemsDone: Int,
    val actionItemCompletionRate: Double,
    val cardsPerParticipant: Double,
    val votesPerParticipant: Double,
    val votesPerCard: Double,
    val actionItemRate: Double
)
