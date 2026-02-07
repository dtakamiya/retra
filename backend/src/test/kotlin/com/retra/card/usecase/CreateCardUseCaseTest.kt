package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.BadRequestException
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

class CreateCardUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: CreateCardUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = CreateCardUseCase(boardRepository, cardRepository, eventPublisher)
    }

    @Test
    fun `WRITINGフェーズでカード作成成功`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        board.columns.add(column)
        board.participants.add(participant)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.countByColumnId("col-1") } returns 0L
        every { cardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", CreateCardRequest("col-1", "New card", "p-1"))

        assertEquals("New card", response.content)
        assertEquals("Alice", response.authorNickname)
    }

    @Test
    fun `非WRITINGフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.VOTING)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", CreateCardRequest("col-1", "Card", "p-1"))
        }
    }

    @Test
    fun `存在しないカラムで NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", CreateCardRequest("bad-col", "Card", "p-1"))
        }
    }
}
