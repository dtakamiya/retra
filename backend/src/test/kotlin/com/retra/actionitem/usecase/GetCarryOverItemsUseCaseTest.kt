package com.retra.actionitem.usecase

import com.retra.TestFixtures
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.shared.domain.NotFoundException
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class GetCarryOverItemsUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val actionItemRepository = mockk<ActionItemRepository>()
    private val useCase = GetCarryOverItemsUseCase(boardRepository, actionItemRepository)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `存在しないボードの場合はNotFoundExceptionをスローする`() {
        every { boardRepository.findBySlug("nonexistent") } returns null

        org.junit.jupiter.api.assertThrows<NotFoundException> {
            useCase.execute("nonexistent")
        }
    }

    @Test
    fun `teamNameが未設定のボードは空リストを返す`() {
        val board = TestFixtures.board(teamName = null)
        every { boardRepository.findBySlug("test1234") } returns board

        val result = useCase.execute("test1234")

        assertTrue(result.items.isEmpty())
        assertEquals("", result.teamName)
    }

    @Test
    fun `同じteamNameのCLOSEDボードがない場合は空リストを返す`() {
        val board = TestFixtures.board(teamName = "チーム Alpha")
        every { boardRepository.findBySlug("test1234") } returns board
        every { boardRepository.findLatestClosedBoardByTeamName("チーム Alpha", board.id) } returns null

        val result = useCase.execute("test1234")

        assertTrue(result.items.isEmpty())
        assertEquals("チーム Alpha", result.teamName)
    }

    @Test
    fun `直近のCLOSEDボードから未完了アクションアイテムを取得する`() {
        val currentBoard = TestFixtures.board(id = "current", slug = "current-slug", teamName = "チーム Alpha")
        val prevBoard = TestFixtures.board(
            id = "prev", slug = "prev-slug", title = "Sprint 42 Retro",
            teamName = "チーム Alpha", phase = Phase.CLOSED,
            updatedAt = "2026-02-07T10:00:00Z"
        )
        val openItem = TestFixtures.actionItem(
            id = "ai-1", board = prevBoard, content = "テスト自動化",
            status = ActionItemStatus.OPEN
        )
        val inProgressItem = TestFixtures.actionItem(
            id = "ai-2", board = prevBoard, content = "リファクタリング",
            status = ActionItemStatus.IN_PROGRESS
        )
        val doneItem = TestFixtures.actionItem(
            id = "ai-3", board = prevBoard, content = "完了済み",
            status = ActionItemStatus.DONE
        )

        every { boardRepository.findBySlug("current-slug") } returns currentBoard
        every { boardRepository.findLatestClosedBoardByTeamName("チーム Alpha", "current") } returns prevBoard
        every { actionItemRepository.findByBoardId("prev") } returns listOf(openItem, inProgressItem, doneItem)

        val result = useCase.execute("current-slug")

        assertEquals(2, result.items.size)
        assertEquals("テスト自動化", result.items[0].content)
        assertEquals("リファクタリング", result.items[1].content)
        assertEquals("Sprint 42 Retro", result.items[0].sourceBoardTitle)
        assertEquals("prev-slug", result.items[0].sourceBoardSlug)
        assertEquals("2026-02-07T10:00:00Z", result.items[0].sourceBoardClosedAt)
        assertEquals("チーム Alpha", result.teamName)
    }

    @Test
    fun `自分自身のボードは対象外`() {
        val board = TestFixtures.board(id = "same-id", slug = "test1234", teamName = "チーム Alpha", phase = Phase.CLOSED)
        every { boardRepository.findBySlug("test1234") } returns board
        every { boardRepository.findLatestClosedBoardByTeamName("チーム Alpha", "same-id") } returns null

        val result = useCase.execute("test1234")

        assertTrue(result.items.isEmpty())
    }

    @Test
    fun `アサイニーのニックネームが正しく取得される`() {
        val currentBoard = TestFixtures.board(id = "current", slug = "current-slug", teamName = "チーム Beta")
        val prevBoard = TestFixtures.board(
            id = "prev", slug = "prev-slug", title = "Sprint 10",
            teamName = "チーム Beta", phase = Phase.CLOSED
        )
        val assignee = TestFixtures.participant(nickname = "田中太郎", board = prevBoard)
        val item = TestFixtures.actionItem(
            id = "ai-1", board = prevBoard, content = "調査タスク",
            assignee = assignee, status = ActionItemStatus.OPEN,
            dueDate = "2026-02-14"
        )

        every { boardRepository.findBySlug("current-slug") } returns currentBoard
        every { boardRepository.findLatestClosedBoardByTeamName("チーム Beta", "current") } returns prevBoard
        every { actionItemRepository.findByBoardId("prev") } returns listOf(item)

        val result = useCase.execute("current-slug")

        assertEquals(1, result.items.size)
        assertEquals("田中太郎", result.items[0].assigneeNickname)
        assertEquals("2026-02-14", result.items[0].dueDate)
        assertEquals("OPEN", result.items[0].status)
        assertEquals("MEDIUM", result.items[0].priority)
    }

    @Test
    fun `複数のCLOSEDボードがある場合は最新のものだけを取得する`() {
        val currentBoard = TestFixtures.board(id = "current", slug = "current-slug", teamName = "チーム Gamma")
        val latestClosedBoard = TestFixtures.board(
            id = "latest", slug = "latest-slug", title = "Sprint 5",
            teamName = "チーム Gamma", phase = Phase.CLOSED,
            updatedAt = "2026-02-10T10:00:00Z"
        )
        val item = TestFixtures.actionItem(
            id = "ai-1", board = latestClosedBoard, content = "最新のタスク",
            status = ActionItemStatus.OPEN
        )

        every { boardRepository.findBySlug("current-slug") } returns currentBoard
        every { boardRepository.findLatestClosedBoardByTeamName("チーム Gamma", "current") } returns latestClosedBoard
        every { actionItemRepository.findByBoardId("latest") } returns listOf(item)

        val result = useCase.execute("current-slug")

        assertEquals(1, result.items.size)
        assertEquals("最新のタスク", result.items[0].content)
        assertEquals("Sprint 5", result.items[0].sourceBoardTitle)
    }
}
