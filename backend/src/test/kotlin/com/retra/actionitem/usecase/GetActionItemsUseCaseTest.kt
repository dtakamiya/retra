package com.retra.actionitem.usecase

import com.retra.TestFixtures
import com.retra.actionitem.domain.ActionItem
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class GetActionItemsUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val actionItemRepository: ActionItemRepository = mockk()
    private lateinit var useCase: GetActionItemsUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = GetActionItemsUseCase(boardRepository, actionItemRepository)
    }

    @Test
    fun `ボードのアクションアイテム一覧取得成功`() {
        val board = TestFixtures.board(id = "board-1", phase = Phase.ACTION_ITEMS)
        val assignee = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        board.participants.add(assignee)
        val actionItems = listOf(
            ActionItem(
                id = "ai-1",
                board = board,
                content = "Action 1",
                assignee = assignee,
                status = ActionItemStatus.OPEN,
                sortOrder = 0,
                createdAt = Instant.now().toString(),
                updatedAt = Instant.now().toString()
            ),
            ActionItem(
                id = "ai-2",
                board = board,
                content = "Action 2",
                assignee = null,
                status = ActionItemStatus.DONE,
                sortOrder = 1,
                createdAt = Instant.now().toString(),
                updatedAt = Instant.now().toString()
            )
        )

        every { boardRepository.findBySlug("test1234") } returns board
        every { actionItemRepository.findByBoardId("board-1") } returns actionItems

        val responses = useCase.execute("test1234")

        assertEquals(2, responses.size)
        assertEquals("Action 1", responses[0].content)
        assertEquals("Alice", responses[0].assigneeNickname)
        assertEquals("OPEN", responses[0].status)
        assertEquals("Action 2", responses[1].content)
        assertEquals(null, responses[1].assigneeNickname)
        assertEquals("DONE", responses[1].status)
    }

    @Test
    fun `アクションアイテムが0件の場合空リスト`() {
        val board = TestFixtures.board(id = "board-1", phase = Phase.ACTION_ITEMS)

        every { boardRepository.findBySlug("test1234") } returns board
        every { actionItemRepository.findByBoardId("board-1") } returns emptyList()

        val responses = useCase.execute("test1234")

        assertEquals(0, responses.size)
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("nonexistent")
        }
    }
}
