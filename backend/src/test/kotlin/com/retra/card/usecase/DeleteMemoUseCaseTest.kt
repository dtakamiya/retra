package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.card.domain.Memo
import com.retra.card.domain.MemoRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertFailsWith

class DeleteMemoUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val memoRepository: MemoRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: DeleteMemoUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = DeleteMemoUseCase(boardRepository, memoRepository, eventPublisher)
    }

    @Test
    fun `著者がメモ削除成功`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        board.columns.add(column)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)
        val memo = Memo(
            id = "memo-1",
            card = card,
            board = board,
            content = "Test memo",
            authorNickname = "Alice",
            participant = participant,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { memoRepository.findById("memo-1") } returns memo
        every { memoRepository.delete(any()) } just runs

        useCase.execute("test1234", "card-1", "memo-1", DeleteMemoRequest("p-1"))

        verify { memoRepository.delete(memo) }
    }

    @Test
    fun `ファシリテーターがメモ削除成功`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        val facilitator = TestFixtures.participant(id = "p-2", board = board, isFacilitator = true)
        board.columns.add(column)
        board.participants.add(author)
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)
        val memo = Memo(
            id = "memo-1",
            card = card,
            board = board,
            content = "Test memo",
            authorNickname = "Alice",
            participant = author,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { memoRepository.findById("memo-1") } returns memo
        every { memoRepository.delete(any()) } just runs

        useCase.execute("test1234", "card-1", "memo-1", DeleteMemoRequest("p-2"))

        verify { memoRepository.delete(memo) }
    }

    @Test
    fun `非著者・非ファシリテーターで ForbiddenException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        val other = TestFixtures.participant(id = "p-3", board = board, isFacilitator = false)
        board.columns.add(column)
        board.participants.add(author)
        board.participants.add(other)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)
        val memo = Memo(
            id = "memo-1",
            card = card,
            board = board,
            content = "Test memo",
            authorNickname = "Alice",
            participant = author,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { memoRepository.findById("memo-1") } returns memo

        assertFailsWith<ForbiddenException> {
            useCase.execute("test1234", "card-1", "memo-1", DeleteMemoRequest("p-3"))
        }
    }

    @Test
    fun `CLOSEDフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.CLOSED)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", "memo-1", DeleteMemoRequest("p-1"))
        }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", "card-1", "memo-1", DeleteMemoRequest("p-1"))
        }
    }

    @Test
    fun `存在しないメモで NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board
        every { memoRepository.findById("memo-1") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "card-1", "memo-1", DeleteMemoRequest("p-1"))
        }
    }
}
