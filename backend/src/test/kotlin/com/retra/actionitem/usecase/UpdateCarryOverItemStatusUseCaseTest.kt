package com.retra.actionitem.usecase

import com.retra.TestFixtures
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals

class UpdateCarryOverItemStatusUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val actionItemRepository = mockk<ActionItemRepository>()
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)
    private val useCase = UpdateCarryOverItemStatusUseCase(boardRepository, actionItemRepository, eventPublisher)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `ファシリテーターが引き継ぎアイテムのステータスを更新できる`() {
        val currentBoard = TestFixtures.board(slug = "current-slug")
        val facilitator = TestFixtures.participant(id = "p-1", board = currentBoard, isFacilitator = true)
        currentBoard.participants.add(facilitator)
        val actionItem = TestFixtures.actionItem(id = "ai-1", board = currentBoard, status = ActionItemStatus.OPEN)

        every { boardRepository.findBySlug("current-slug") } returns currentBoard
        every { actionItemRepository.findById("ai-1") } returns actionItem
        every { actionItemRepository.save(any()) } answers { firstArg() }

        useCase.execute("current-slug", "ai-1", UpdateActionItemStatusRequest(status = "DONE", participantId = "p-1"))

        assertEquals(ActionItemStatus.DONE, actionItem.status)
        verify { actionItemRepository.save(actionItem) }
        verify { eventPublisher.publishAll(any()) }
    }

    @Test
    fun `ファシリテーター以外はステータスを更新できない`() {
        val currentBoard = TestFixtures.board(slug = "current-slug")
        val member = TestFixtures.participant(id = "p-2", board = currentBoard, isFacilitator = false)
        currentBoard.participants.add(member)

        every { boardRepository.findBySlug("current-slug") } returns currentBoard

        assertThrows<ForbiddenException> {
            useCase.execute("current-slug", "ai-1", UpdateActionItemStatusRequest(status = "DONE", participantId = "p-2"))
        }
    }

    @Test
    fun `存在しないアクションアイテムはNotFoundExceptionをスロー`() {
        val currentBoard = TestFixtures.board(slug = "current-slug")
        val facilitator = TestFixtures.participant(id = "p-1", board = currentBoard, isFacilitator = true)
        currentBoard.participants.add(facilitator)

        every { boardRepository.findBySlug("current-slug") } returns currentBoard
        every { actionItemRepository.findById("ai-999") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("current-slug", "ai-999", UpdateActionItemStatusRequest(status = "DONE", participantId = "p-1"))
        }
    }
}
