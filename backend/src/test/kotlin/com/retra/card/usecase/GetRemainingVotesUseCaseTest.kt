package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.VoteRepository
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class GetRemainingVotesUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val voteRepository: VoteRepository = mockk()
    private lateinit var useCase: GetRemainingVotesUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = GetRemainingVotesUseCase(boardRepository, voteRepository)
    }

    @Test
    fun `残り投票数を正しく計算`() {
        val board = TestFixtures.board(maxVotesPerPerson = 5)
        every { boardRepository.findBySlug(any()) } returns board
        every { voteRepository.countByParticipantIdAndCardBoardId("p-1", board.id) } returns 2L

        val response = useCase.execute("test1234", "p-1")

        assertEquals("p-1", response.participantId)
        assertEquals(3, response.remaining)
        assertEquals(5, response.max)
        assertEquals(2, response.used)
    }

    @Test
    fun `投票上限に達している場合 remaining は 0`() {
        val board = TestFixtures.board(maxVotesPerPerson = 3)
        every { boardRepository.findBySlug(any()) } returns board
        every { voteRepository.countByParticipantIdAndCardBoardId("p-1", board.id) } returns 3L

        val response = useCase.execute("test1234", "p-1")

        assertEquals(0, response.remaining)
        assertEquals(3, response.max)
        assertEquals(3, response.used)
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", "p-1")
        }
    }
}
