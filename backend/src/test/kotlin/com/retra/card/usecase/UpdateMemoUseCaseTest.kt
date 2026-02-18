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
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class UpdateMemoUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val memoRepository: MemoRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: UpdateMemoUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = UpdateMemoUseCase(boardRepository, memoRepository, eventPublisher)
    }

    @Test
    fun `著者がメモ更新成功`() {
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
            content = "Original",
            authorNickname = "Alice",
            participant = participant,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { memoRepository.findById("memo-1") } returns memo
        every { memoRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", "card-1", "memo-1", UpdateMemoRequest("Updated", "p-1"))

        assertEquals("Updated", response.content)
        verify { memoRepository.save(any()) }
    }

    @Test
    fun `非著者で ForbiddenException`() {
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
            content = "Original",
            authorNickname = "Alice",
            participant = participant,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        every { boardRepository.findBySlug(any()) } returns board
        every { memoRepository.findById("memo-1") } returns memo

        assertFailsWith<ForbiddenException> {
            useCase.execute("test1234", "card-1", "memo-1", UpdateMemoRequest("Updated", "p-2"))
        }
    }

    @Test
    fun `空のcontentで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", "memo-1", UpdateMemoRequest("   ", "p-1"))
        }
    }

    @Test
    fun `2000文字超のcontentで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board

        val longContent = "a".repeat(2001)
        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", "memo-1", UpdateMemoRequest(longContent, "p-1"))
        }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", "card-1", "memo-1", UpdateMemoRequest("Updated", "p-1"))
        }
    }

    @Test
    fun `存在しないメモで NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board
        every { memoRepository.findById("memo-1") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "card-1", "memo-1", UpdateMemoRequest("Updated", "p-1"))
        }
    }
}
