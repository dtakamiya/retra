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
import kotlin.test.assertFailsWith

class DeleteCardUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: DeleteCardUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = DeleteCardUseCase(boardRepository, cardRepository, eventPublisher)
    }

    @Test
    fun `著者によるカード削除成功`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.columns.add(column)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board, column = column, participant = participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.delete(any()) } just runs

        useCase.execute("test1234", "card-1", DeleteCardRequest("p-1"))

        verify { cardRepository.delete(card) }
    }

    @Test
    fun `ファシリテーターによるカード削除成功`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board)
        val facilitator = TestFixtures.participant(id = "p-2", board = board, isFacilitator = true)
        board.columns.add(column)
        board.participants.add(author)
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board, column = column, participant = author)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.delete(any()) } just runs

        useCase.execute("test1234", "card-1", DeleteCardRequest("p-2"))

        verify { cardRepository.delete(card) }
    }

    @Test
    fun `非著者・非ファシリテーターで ForbiddenException`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board)
        val other = TestFixtures.participant(id = "p-3", board = board, isFacilitator = false)
        board.columns.add(column)
        board.participants.add(author)
        board.participants.add(other)
        val card = TestFixtures.card(id = "card-1", board = board, column = column, participant = author)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<ForbiddenException> {
            useCase.execute("test1234", "card-1", DeleteCardRequest("p-3"))
        }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", "card-1", DeleteCardRequest("p-1"))
        }
    }

    @Test
    fun `存在しないカードで NotFoundException`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "card-1", DeleteCardRequest("p-1"))
        }
    }

    @Test
    fun `カードがボードに属していない場合 BadRequestException`() {
        val board = TestFixtures.board(id = "board-1")
        val otherBoard = TestFixtures.board(id = "board-2")
        val column = TestFixtures.boardColumn(id = "col-1", board = otherBoard)
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = otherBoard, column = column, participant = participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", DeleteCardRequest("p-1"))
        }
    }
}
