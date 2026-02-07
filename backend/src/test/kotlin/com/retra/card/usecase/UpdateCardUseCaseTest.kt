package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class UpdateCardUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: UpdateCardUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = UpdateCardUseCase(boardRepository, cardRepository, eventPublisher)
    }

    @Test
    fun `著者によるカード更新成功`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.columns.add(column)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board, column = column, participant = participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "card-1", UpdateCardRequest("Updated content", "p-1"))

        assertEquals("Updated content", response.content)
    }

    @Test
    fun `非著者による更新で ForbiddenException`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board, participant = participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<ForbiddenException> {
            useCase.execute("test1234", "card-1", UpdateCardRequest("Updated", "p-2"))
        }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", "card-1", UpdateCardRequest("Updated", "p-1"))
        }
    }

    @Test
    fun `存在しないカードで NotFoundException`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("bad-card") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "bad-card", UpdateCardRequest("Updated", "p-1"))
        }
    }

    @Test
    fun `別ボードのカードで BadRequestException`() {
        val board1 = TestFixtures.board(id = "board-1")
        val board2 = TestFixtures.board(id = "board-2")
        val card = TestFixtures.card(id = "card-1", board = board2)

        every { boardRepository.findBySlug(any()) } returns board1
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", UpdateCardRequest("Updated", "p-1"))
        }
    }
}
