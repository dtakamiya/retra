package com.retra.history.usecase

import com.retra.TestFixtures
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class SnapshotMapperTest {

    @Test
    fun `toTrendPointでエンゲージメント指標が正しく計算される`() {
        val snapshot = TestFixtures.boardSnapshot(
            totalCards = 12,
            totalVotes = 30,
            totalParticipants = 5,
            actionItemsTotal = 4,
            actionItemsDone = 2
        )

        val result = SnapshotMapper.toTrendPoint(snapshot)

        assertEquals(2.4, result.cardsPerParticipant)
        assertEquals(6.0, result.votesPerParticipant)
        assertEquals(2.5, result.votesPerCard)
        assertEquals(100.0 * 4 / 12, result.actionItemRate, 0.01)
    }

    @Test
    fun `参加者がゼロの場合のエンゲージメント指標は0`() {
        val snapshot = TestFixtures.boardSnapshot(
            totalCards = 5,
            totalVotes = 10,
            totalParticipants = 0,
            actionItemsTotal = 2,
            actionItemsDone = 1
        )

        val result = SnapshotMapper.toTrendPoint(snapshot)

        assertEquals(0.0, result.cardsPerParticipant)
        assertEquals(0.0, result.votesPerParticipant)
    }

    @Test
    fun `カードがゼロの場合のエンゲージメント指標は0`() {
        val snapshot = TestFixtures.boardSnapshot(
            totalCards = 0,
            totalVotes = 0,
            totalParticipants = 3,
            actionItemsTotal = 0,
            actionItemsDone = 0
        )

        val result = SnapshotMapper.toTrendPoint(snapshot)

        assertEquals(0.0, result.cardsPerParticipant)
        assertEquals(0.0, result.votesPerCard)
        assertEquals(0.0, result.actionItemRate)
    }
}
