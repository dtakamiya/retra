package com.retra.history.usecase

import com.retra.TestFixtures
import com.retra.history.domain.BoardSnapshotRepository
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class GetTeamHistoryUseCaseTest {

    private val snapshotRepository: BoardSnapshotRepository = mockk()
    private lateinit var useCase: GetTeamHistoryUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = GetTeamHistoryUseCase(snapshotRepository)
    }

    @Test
    fun `チーム名でフィルタして履歴を取得できる`() {
        val snapshots = listOf(
            TestFixtures.boardSnapshot(id = "s-1", teamName = "Team Alpha", closedAt = "2025-01-02T00:00:00Z"),
            TestFixtures.boardSnapshot(id = "s-2", teamName = "Team Alpha", closedAt = "2025-01-01T00:00:00Z")
        )
        every { snapshotRepository.findByTeamNameOrderByClosedAtDesc("Team Alpha") } returns snapshots

        val result = useCase.getHistory("Team Alpha")

        assertEquals(2, result.size)
        assertEquals("s-1", result[0].id)
        assertEquals("s-2", result[1].id)
        assertEquals("Team Alpha", result[0].teamName)
        verify(exactly = 1) { snapshotRepository.findByTeamNameOrderByClosedAtDesc("Team Alpha") }
        verify(exactly = 0) { snapshotRepository.findAllOrderByClosedAtDesc() }
    }

    @Test
    fun `全ての履歴を取得できる`() {
        val snapshots = listOf(
            TestFixtures.boardSnapshot(id = "s-1", teamName = "Team Alpha", closedAt = "2025-01-03T00:00:00Z"),
            TestFixtures.boardSnapshot(id = "s-2", teamName = "Team Beta", closedAt = "2025-01-02T00:00:00Z"),
            TestFixtures.boardSnapshot(id = "s-3", teamName = "Team Alpha", closedAt = "2025-01-01T00:00:00Z")
        )
        every { snapshotRepository.findAllOrderByClosedAtDesc() } returns snapshots

        val result = useCase.getHistory(null)

        assertEquals(3, result.size)
        assertEquals("s-1", result[0].id)
        assertEquals("s-2", result[1].id)
        assertEquals("s-3", result[2].id)
        verify(exactly = 0) { snapshotRepository.findByTeamNameOrderByClosedAtDesc(any()) }
        verify(exactly = 1) { snapshotRepository.findAllOrderByClosedAtDesc() }
    }

    @Test
    fun `トレンドデータの完了率が正しく計算される`() {
        val snapshots = listOf(
            TestFixtures.boardSnapshot(
                id = "s-2",
                closedAt = "2025-01-02T00:00:00Z",
                actionItemsTotal = 4,
                actionItemsDone = 2
            ),
            TestFixtures.boardSnapshot(
                id = "s-1",
                closedAt = "2025-01-01T00:00:00Z",
                actionItemsTotal = 5,
                actionItemsDone = 5
            )
        )
        every { snapshotRepository.findAllOrderByClosedAtDesc() } returns snapshots

        val result = useCase.getTrends(null)

        assertEquals(2, result.snapshots.size)
        // reversed order: oldest first
        assertEquals("2025-01-01T00:00:00Z", result.snapshots[0].closedAt)
        assertEquals(100.0, result.snapshots[0].actionItemCompletionRate)
        assertEquals("2025-01-02T00:00:00Z", result.snapshots[1].closedAt)
        assertEquals(50.0, result.snapshots[1].actionItemCompletionRate)
    }

    @Test
    fun `アクションアイテムがゼロの場合の完了率は0`() {
        val snapshots = listOf(
            TestFixtures.boardSnapshot(
                id = "s-1",
                closedAt = "2025-01-01T00:00:00Z",
                actionItemsTotal = 0,
                actionItemsDone = 0
            )
        )
        every { snapshotRepository.findAllOrderByClosedAtDesc() } returns snapshots

        val result = useCase.getTrends(null)

        assertEquals(1, result.snapshots.size)
        assertEquals(0.0, result.snapshots[0].actionItemCompletionRate)
    }

    @Test
    fun `チーム名でフィルタしてトレンドを取得できる`() {
        val snapshots = listOf(
            TestFixtures.boardSnapshot(id = "s-1", teamName = "Team Alpha", closedAt = "2025-01-02T00:00:00Z")
        )
        every { snapshotRepository.findByTeamNameOrderByClosedAtDesc("Team Alpha") } returns snapshots

        val result = useCase.getTrends("Team Alpha")

        assertEquals(1, result.snapshots.size)
        verify(exactly = 1) { snapshotRepository.findByTeamNameOrderByClosedAtDesc("Team Alpha") }
    }

    @Test
    fun `履歴が空の場合は空リストを返す`() {
        every { snapshotRepository.findAllOrderByClosedAtDesc() } returns emptyList()

        val result = useCase.getHistory(null)

        assertEquals(0, result.size)
    }
}
