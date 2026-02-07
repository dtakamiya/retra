package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.card.domain.CardRepository
import com.retra.card.domain.MemoRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class CreateMemoUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val memoRepository: MemoRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: CreateMemoUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = CreateMemoUseCase(boardRepository, cardRepository, memoRepository, eventPublisher)
    }

    @Test
    fun `DISCUSSIONフェーズでメモ作成成功`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        board.columns.add(column)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { memoRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "card-1", CreateMemoRequest("New memo", "p-1"))

        assertEquals("New memo", response.content)
        assertEquals("Alice", response.authorNickname)
        verify { memoRepository.save(any()) }
    }

    @Test
    fun `ACTION_ITEMSフェーズでメモ作成成功`() {
        val board = TestFixtures.board(phase = Phase.ACTION_ITEMS)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Bob")
        board.columns.add(column)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { memoRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "card-1", CreateMemoRequest("Action memo", "p-1"))

        assertEquals("Action memo", response.content)
        assertEquals("Bob", response.authorNickname)
    }

    @Test
    fun `WRITINGフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", CreateMemoRequest("Memo", "p-1"))
        }
    }

    @Test
    fun `空のcontentで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", CreateMemoRequest("   ", "p-1"))
        }
    }

    @Test
    fun `2000文字超のcontentで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board

        val longContent = "a".repeat(2001)
        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", CreateMemoRequest(longContent, "p-1"))
        }
    }

    @Test
    fun `存在しないカードで NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("bad-card") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "bad-card", CreateMemoRequest("Memo", "p-1"))
        }
    }
}
