package com.retra.actionitem.usecase

import com.retra.TestFixtures
import com.retra.actionitem.domain.ActionItem
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class UpdateActionItemUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val actionItemRepository: ActionItemRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: UpdateActionItemUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = UpdateActionItemUseCase(boardRepository, actionItemRepository, eventPublisher)
    }

    @Test
    fun `ファシリテーターがアクションアイテム更新成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice", isFacilitator = true)
        board.participants.add(facilitator)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Original",
            assignee = facilitator,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "ai-1", UpdateActionItemRequest("Updated", "p-1"))

        assertEquals("Updated", response.content)
        verify { actionItemRepository.save(any()) }
        verify { eventPublisher.publishAll(any()) }
    }

    @Test
    fun `担当者がアクションアイテム更新成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val assignee = TestFixtures.participant(id = "p-2", board = board, nickname = "Bob")
        board.participants.add(assignee)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Original",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "ai-1", UpdateActionItemRequest("Updated by assignee", "p-2"))

        assertEquals("Updated by assignee", response.content)
    }

    @Test
    fun `担当者変更でアクションアイテム更新成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice", isFacilitator = true)
        val newAssignee = TestFixtures.participant(id = "p-2", board = board, nickname = "Bob")
        board.participants.add(facilitator)
        board.participants.add(newAssignee)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Original",
            assignee = null,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(
            "test1234", "ai-1",
            UpdateActionItemRequest("Updated", "p-1", assigneeId = "p-2")
        )

        assertEquals("p-2", response.assigneeId)
        assertEquals("Bob", response.assigneeNickname)
    }

    @Test
    fun `非ファシリテーター・非担当者で ForbiddenException`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val assignee = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        val other = TestFixtures.participant(id = "p-3", board = board, nickname = "Charlie", isFacilitator = false)
        board.participants.add(assignee)
        board.participants.add(other)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Original",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem

        assertFailsWith<ForbiddenException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemRequest("Updated", "p-3"))
        }
    }

    @Test
    fun `WRITINGフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemRequest("Updated", "p-1"))
        }
    }

    @Test
    fun `空のcontentで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemRequest("   ", "p-1"))
        }
    }

    @Test
    fun `2000文字超のcontentで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        every { boardRepository.findBySlug(any()) } returns board

        val longContent = "a".repeat(2001)
        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemRequest(longContent, "p-1"))
        }
    }

    @Test
    fun `存在しないアクションアイテムで NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("bad-id") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "bad-id", UpdateActionItemRequest("Updated", "p-1"))
        }
    }

    @Test
    fun `別ボードのアクションアイテムで BadRequestException`() {
        val board = TestFixtures.board(id = "board-1", phase = Phase.ACTION_ITEMS)
        val otherBoard = TestFixtures.board(id = "board-2")
        val participant = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(participant)
        val actionItem = ActionItem(
            id = "ai-1",
            board = otherBoard,
            content = "Original",
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemRequest("Updated", "p-1"))
        }
    }
}
