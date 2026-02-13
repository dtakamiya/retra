package com.retra.actionitem.usecase

import com.retra.TestFixtures
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.card.domain.CardRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class CreateActionItemUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val actionItemRepository: ActionItemRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: CreateActionItemUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = CreateActionItemUseCase(boardRepository, cardRepository, actionItemRepository, eventPublisher)
    }

    @Test
    fun `ACTION_ITEMSフェーズでアクションアイテム作成成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        board.participants.add(participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.countByBoardId(any()) } returns 0
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", CreateActionItemRequest("New action item", "p-1"))

        assertEquals("New action item", response.content)
        assertEquals("OPEN", response.status)
        assertEquals(0, response.sortOrder)
        verify { actionItemRepository.save(any()) }
        verify { eventPublisher.publishAll(any()) }
    }

    @Test
    fun `カード紐付きでアクションアイテム作成成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        board.columns.add(column)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { actionItemRepository.countByBoardId(any()) } returns 2
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(
            "test1234",
            CreateActionItemRequest("Action with card", "p-1", cardId = "card-1")
        )

        assertEquals("Action with card", response.content)
        assertEquals("card-1", response.cardId)
        assertEquals(2, response.sortOrder)
    }

    @Test
    fun `担当者付きでアクションアイテム作成成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        val assignee = TestFixtures.participant(id = "p-2", board = board, nickname = "Bob")
        board.participants.add(participant)
        board.participants.add(assignee)

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.countByBoardId(any()) } returns 0
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(
            "test1234",
            CreateActionItemRequest("Action for Bob", "p-1", assigneeId = "p-2")
        )

        assertEquals("Action for Bob", response.content)
        assertEquals("p-2", response.assigneeId)
        assertEquals("Bob", response.assigneeNickname)
    }

    @Test
    fun `期限付きでアクションアイテム作成成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        board.participants.add(participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.countByBoardId(any()) } returns 0
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(
            "test1234",
            CreateActionItemRequest("Action with due", "p-1", dueDate = "2026-03-01")
        )

        assertEquals("2026-03-01", response.dueDate)
    }

    @Test
    fun `担当者なしの場合assigneeIdがnull`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        board.participants.add(participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { actionItemRepository.countByBoardId(any()) } returns 0
        every { actionItemRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", CreateActionItemRequest("No assignee", "p-1"))

        assertNull(response.assigneeId)
        assertNull(response.assigneeNickname)
    }

    @Test
    fun `WRITINGフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", CreateActionItemRequest("Action", "p-1"))
        }
    }

    @Test
    fun `DISCUSSIONフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", CreateActionItemRequest("Action", "p-1"))
        }
    }

    @Test
    fun `VOTINGフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.VOTING)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", CreateActionItemRequest("Action", "p-1"))
        }
    }

    @Test
    fun `CLOSEDフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.CLOSED)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", CreateActionItemRequest("Action", "p-1"))
        }
    }

    @Test
    fun `空のcontentで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", CreateActionItemRequest("   ", "p-1"))
        }
    }

    @Test
    fun `2000文字超のcontentで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        every { boardRepository.findBySlug(any()) } returns board

        val longContent = "a".repeat(2001)
        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", CreateActionItemRequest(longContent, "p-1"))
        }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("nonexistent", CreateActionItemRequest("Action", "p-1"))
        }
    }

    @Test
    fun `存在しないカードで NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("bad-card") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", CreateActionItemRequest("Action", "p-1", cardId = "bad-card"))
        }
    }

    @Test
    fun `別ボードのカードで BadRequestException`() {
        val board = TestFixtures.board(id = "board-1", phase = Phase.ACTION_ITEMS)
        val otherBoard = TestFixtures.board(id = "board-2")
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)
        val otherColumn = TestFixtures.boardColumn(board = otherBoard)
        val otherCard = TestFixtures.card(id = "card-other", board = otherBoard, column = otherColumn)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-other") } returns otherCard

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", CreateActionItemRequest("Action", "p-1", cardId = "card-other"))
        }
    }

    @Test
    fun `存在しない参加者で NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", CreateActionItemRequest("Action", "nonexistent"))
        }
    }
}
