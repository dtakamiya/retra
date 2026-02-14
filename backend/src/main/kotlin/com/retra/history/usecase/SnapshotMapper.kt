package com.retra.history.usecase

import com.retra.history.domain.BoardSnapshot

object SnapshotMapper {

    fun toSummary(snapshot: BoardSnapshot): SnapshotSummaryResponse {
        return SnapshotSummaryResponse(
            id = snapshot.id,
            teamName = snapshot.teamName,
            framework = snapshot.framework,
            closedAt = snapshot.closedAt,
            totalCards = snapshot.totalCards,
            totalVotes = snapshot.totalVotes,
            totalParticipants = snapshot.totalParticipants,
            actionItemsTotal = snapshot.actionItemsTotal,
            actionItemsDone = snapshot.actionItemsDone
        )
    }

    fun toDetail(snapshot: BoardSnapshot): SnapshotDetailResponse {
        return SnapshotDetailResponse(
            id = snapshot.id,
            teamName = snapshot.teamName,
            framework = snapshot.framework,
            closedAt = snapshot.closedAt,
            totalCards = snapshot.totalCards,
            totalVotes = snapshot.totalVotes,
            totalParticipants = snapshot.totalParticipants,
            actionItemsTotal = snapshot.actionItemsTotal,
            actionItemsDone = snapshot.actionItemsDone,
            snapshotData = snapshot.snapshotData
        )
    }

    fun toTrendPoint(snapshot: BoardSnapshot): TrendPoint {
        val completionRate = if (snapshot.actionItemsTotal > 0) {
            snapshot.actionItemsDone.toDouble() / snapshot.actionItemsTotal * 100
        } else {
            0.0
        }
        return TrendPoint(
            closedAt = snapshot.closedAt,
            totalCards = snapshot.totalCards,
            totalVotes = snapshot.totalVotes,
            totalParticipants = snapshot.totalParticipants,
            actionItemsTotal = snapshot.actionItemsTotal,
            actionItemsDone = snapshot.actionItemsDone,
            actionItemCompletionRate = completionRate,
            cardsPerParticipant = safeDiv(snapshot.totalCards, snapshot.totalParticipants),
            votesPerParticipant = safeDiv(snapshot.totalVotes, snapshot.totalParticipants),
            votesPerCard = safeDiv(snapshot.totalVotes, snapshot.totalCards),
            actionItemRate = safeDiv(snapshot.actionItemsTotal, snapshot.totalCards) * 100
        )
    }

    private fun safeDiv(numerator: Int, denominator: Int): Double =
        if (denominator > 0) numerator.toDouble() / denominator else 0.0
}
