package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.board.domain.Phase
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class MoveCardUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: MoveCardUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = MoveCardUseCase(boardRepository, cardRepository, eventPublisher)
    }

    @Test
    fun `DISCUSSIONフェーズでファシリテーターによる同カラム内並べ替え成功`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.columns.add(col1)
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = facilitator, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns emptyList()
        every { cardRepository.save(any()) } answers { firstArg() }

        useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 1, "p-1"))

        assertEquals("col-1", card.column?.id)
        assertEquals(1, card.sortOrder)
    }

    @Test
    fun `WRITINGフェーズで著者による同カラム内並べ替え`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board)
        board.columns.add(col1)
        board.participants.add(author)
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = author, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns emptyList()
        every { cardRepository.save(any()) } answers { firstArg() }

        useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 1, "p-1"))

        assertEquals(1, card.sortOrder)
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", "card-1", MoveCardRequest("col-2", 0, "p-1"))
        }
    }

    @Test
    fun `存在しないカードで NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("bad-card") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "bad-card", MoveCardRequest("col-2", 0, "p-1"))
        }
    }
}
