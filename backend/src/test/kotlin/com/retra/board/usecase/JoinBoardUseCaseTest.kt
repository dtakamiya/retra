package com.retra.board.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class JoinBoardUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: JoinBoardUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = JoinBoardUseCase(boardRepository, eventPublisher)
    }

    @Test
    fun `最初の参加者はファシリテーター`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug(any()) } returns board
        every { boardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", JoinBoardRequest("Alice"))

        assertEquals("Alice", response.nickname)
        assertTrue(response.isFacilitator)
    }

    @Test
    fun `2人目の参加者はファシリテーターでない`() {
        val board = TestFixtures.board()
        val existing = TestFixtures.participant(board = board, isFacilitator = true)
        board.participants.add(existing)
        every { boardRepository.findBySlug(any()) } returns board
        every { boardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", JoinBoardRequest("Bob"))

        assertEquals("Bob", response.nickname)
        assertEquals(false, response.isFacilitator)
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", JoinBoardRequest("Alice"))
        }
    }
}
