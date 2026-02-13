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

class UpdateActionItemStatusUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val actionItemRepository: ActionItemRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: UpdateActionItemStatusUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = UpdateActionItemStatusUseCase(boardRepository, actionItemRepository, eventPublisher)
    }

    @Test
    fun `ファシリテーターがステータスをIN_PROGRESSに変更成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice", isFacilitator = true)
        board.participants.add(facilitator)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Test action",
            assignee = facilitator,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "ai-1", UpdateActionItemStatusRequest("IN_PROGRESS", "p-1"))

        assertEquals("IN_PROGRESS", response.status)
        verify { actionItemRepository.save(any()) }
        verify { eventPublisher.publishAll(any()) }
    }

    @Test
    fun `担当者がステータスをDONEに変更成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val assignee = TestFixtures.participant(id = "p-2", board = board, nickname = "Bob")
        board.participants.add(assignee)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Test action",
            assignee = assignee,
            status = ActionItemStatus.IN_PROGRESS,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "ai-1", UpdateActionItemStatusRequest("DONE", "p-2"))

        assertEquals("DONE", response.status)
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
            content = "Test action",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem

        assertFailsWith<ForbiddenException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemStatusRequest("DONE", "p-3"))
        }
    }

    @Test
    fun `無効なステータス文字列で BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice", isFacilitator = true)
        board.participants.add(facilitator)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Test action",
            assignee = facilitator,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemStatusRequest("INVALID", "p-1"))
        }
    }

    @Test
    fun `WRITINGフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemStatusRequest("DONE", "p-1"))
        }
    }

    @Test
    fun `CLOSEDフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.CLOSED)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemStatusRequest("DONE", "p-1"))
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
            useCase.execute("test1234", "bad-id", UpdateActionItemStatusRequest("DONE", "p-1"))
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
            content = "Test action",
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.findById("ai-1") } returns actionItem

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "ai-1", UpdateActionItemStatusRequest("DONE", "p-1"))
        }
    }
}
