package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.card.domain.CardRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.assertFalse
import kotlin.test.assertFailsWith

class MarkCardDiscussedUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: MarkCardDiscussedUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = MarkCardDiscussedUseCase(boardRepository, cardRepository, eventPublisher)
    }

    @Test
    fun `ファシリテーターが議論済みマークを付ける`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val column = TestFixtures.boardColumn(board = board)
        val facilitator = TestFixtures.participant(id = "fac-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "card-1", MarkCardDiscussedRequest("fac-1", true))

        assertTrue(response.isDiscussed)
        verify { cardRepository.save(any()) }
        verify { eventPublisher.publish(any()) }
    }

    @Test
    fun `ファシリテーターが議論済みマークを外す`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val column = TestFixtures.boardColumn(board = board)
        val facilitator = TestFixtures.participant(id = "fac-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "card-1", MarkCardDiscussedRequest("fac-1", false))

        assertFalse(response.isDiscussed)
        verify { cardRepository.save(any()) }
        verify { eventPublisher.publish(any()) }
    }

    @Test
    fun `DISCUSSIONフェーズ以外で BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)

        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", MarkCardDiscussedRequest("fac-1", true))
        }
    }

    @Test
    fun `参加者が見つからない場合 NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)

        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "card-1", MarkCardDiscussedRequest("unknown", true))
        }
    }

    @Test
    fun `ファシリテーターでない場合 ForbiddenException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val participant = TestFixtures.participant(id = "p-1", board = board, isFacilitator = false)
        board.participants.add(participant)

        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<ForbiddenException> {
            useCase.execute("test1234", "card-1", MarkCardDiscussedRequest("p-1", true))
        }
    }

    @Test
    fun `カードが見つからない場合 NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val facilitator = TestFixtures.participant(id = "fac-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-999") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "card-999", MarkCardDiscussedRequest("fac-1", true))
        }
    }

    @Test
    fun `別のボードのカードで BadRequestException`() {
        val board1 = TestFixtures.board(id = "board-1", phase = Phase.DISCUSSION)
        val board2 = TestFixtures.board(id = "board-2", phase = Phase.DISCUSSION)
        val facilitator = TestFixtures.participant(id = "fac-1", board = board1, isFacilitator = true)
        board1.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board2)

        every { boardRepository.findBySlug(any()) } returns board1
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", MarkCardDiscussedRequest("fac-1", true))
        }
    }
}
