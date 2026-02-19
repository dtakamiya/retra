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
    fun `チーム名でフィルタしてページング付き履歴を取得できる`() {
        val snapshots = listOf(
            TestFixtures.boardSnapshot(id = "s-1", teamName = "Team Alpha", closedAt = "2025-01-02T00:00:00Z"),
            TestFixtures.boardSnapshot(id = "s-2", teamName = "Team Alpha", closedAt = "2025-01-01T00:00:00Z")
        )
        every { snapshotRepository.findByTeamNameOrderByClosedAtDesc("Team Alpha", 0, 10) } returns snapshots
        every { snapshotRepository.countByTeamName("Team Alpha") } returns 2L

        val result = useCase.getHistory("Team Alpha", 0, 10)

        assertEquals(2, result.content.size)
        assertEquals("s-1", result.content[0].id)
        assertEquals("s-2", result.content[1].id)
        assertEquals("Team Alpha", result.content[0].teamName)
        assertEquals(2L, result.totalElements)
        assertEquals(1, result.totalPages)
        assertEquals(0, result.currentPage)
        assertEquals(10, result.pageSize)
        verify(exactly = 1) { snapshotRepository.findByTeamNameOrderByClosedAtDesc("Team Alpha", 0, 10) }
        verify(exactly = 0) { snapshotRepository.findAllOrderByClosedAtDesc(any(), any()) }
    }

    @Test
    fun `全てのページング付き履歴を取得できる`() {
        val snapshots = listOf(
            TestFixtures.boardSnapshot(id = "s-1", teamName = "Team Alpha", closedAt = "2025-01-03T00:00:00Z"),
            TestFixtures.boardSnapshot(id = "s-2", teamName = "Team Beta", closedAt = "2025-01-02T00:00:00Z")
        )
        every { snapshotRepository.findAllOrderByClosedAtDesc(0, 10) } returns snapshots
        every { snapshotRepository.countAll() } returns 5L

        val result = useCase.getHistory(null, 0, 10)

        assertEquals(2, result.content.size)
        assertEquals("s-1", result.content[0].id)
        assertEquals("s-2", result.content[1].id)
        assertEquals(5L, result.totalElements)
        assertEquals(1, result.totalPages)
        verify(exactly = 0) { snapshotRepository.findByTeamNameOrderByClosedAtDesc(any(), any(), any()) }
        verify(exactly = 1) { snapshotRepository.findAllOrderByClosedAtDesc(0, 10) }
    }

    @Test
    fun `totalPagesが正しく計算される`() {
        every { snapshotRepository.findAllOrderByClosedAtDesc(0, 10) } returns emptyList()
        every { snapshotRepository.countAll() } returns 25L

        val result = useCase.getHistory(null, 0, 10)

        assertEquals(3, result.totalPages)
        assertEquals(25L, result.totalElements)
    }

    @Test
    fun `デフォルトパラメータでページング取得できる`() {
        every { snapshotRepository.findAllOrderByClosedAtDesc(0, 10) } returns emptyList()
        every { snapshotRepository.countAll() } returns 0L

        val result = useCase.getHistory(null)

        assertEquals(0, result.content.size)
        assertEquals(0L, result.totalElements)
        assertEquals(0, result.totalPages)
        assertEquals(0, result.currentPage)
        assertEquals(10, result.pageSize)
    }

    @Test
    fun `空ページの場合は空リストを返す`() {
        every { snapshotRepository.findAllOrderByClosedAtDesc(2, 10) } returns emptyList()
        every { snapshotRepository.countAll() } returns 15L

        val result = useCase.getHistory(null, 2, 10)

        assertEquals(0, result.content.size)
        assertEquals(15L, result.totalElements)
        assertEquals(2, result.totalPages)
        assertEquals(2, result.currentPage)
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
}
