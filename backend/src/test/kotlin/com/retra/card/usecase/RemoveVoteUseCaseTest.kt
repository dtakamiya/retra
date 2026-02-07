package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.VoteRepository
import com.retra.board.domain.Phase
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertFailsWith

class RemoveVoteUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val voteRepository: VoteRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: RemoveVoteUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = RemoveVoteUseCase(boardRepository, voteRepository, eventPublisher)
    }

    @Test
    fun `VOTINGフェーズで投票削除成功`() {
        val board = TestFixtures.board(phase = Phase.VOTING)
        val vote = TestFixtures.vote()

        every { boardRepository.findBySlug(any()) } returns board
        every { voteRepository.findByCardIdAndParticipantId("card-1", "p-1") } returns vote
        every { voteRepository.delete(any()) } just runs

        useCase.execute("test1234", RemoveVoteRequest("card-1", "p-1"))

        verify { voteRepository.delete(vote) }
    }

    @Test
    fun `非VOTINGフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", RemoveVoteRequest("card-1", "p-1"))
        }
    }

    @Test
    fun `存在しない投票で NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.VOTING)
        every { boardRepository.findBySlug(any()) } returns board
        every { voteRepository.findByCardIdAndParticipantId("card-1", "p-1") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", RemoveVoteRequest("card-1", "p-1"))
        }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", RemoveVoteRequest("card-1", "p-1"))
        }
    }
}
