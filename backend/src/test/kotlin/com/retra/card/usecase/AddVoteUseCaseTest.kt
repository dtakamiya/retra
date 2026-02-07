package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ConflictException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.CardRepository
import com.retra.card.domain.VoteRepository
import com.retra.board.domain.Phase
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AddVoteUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val voteRepository: VoteRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: AddVoteUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = AddVoteUseCase(boardRepository, cardRepository, voteRepository, eventPublisher)
    }

    @Test
    fun `VOTINGフェーズで投票成功`() {
        val board = TestFixtures.board(phase = Phase.VOTING, maxVotesPerPerson = 5)
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { voteRepository.countByParticipantIdAndCardBoardId("p-1", board.id) } returns 0
        every { voteRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", VoteRequest("card-1", "p-1"))

        assertEquals("card-1", response.cardId)
        assertEquals("p-1", response.participantId)
    }

    @Test
    fun `非VOTINGフェーズで BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", VoteRequest("card-1", "p-1"))
        }
    }

    @Test
    fun `重複投票で ConflictException`() {
        val board = TestFixtures.board(phase = Phase.VOTING, maxVotesPerPerson = 5)
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board)
        val existingVote = TestFixtures.vote(card = card, participant = participant)
        card.votes.add(existingVote)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { voteRepository.countByParticipantIdAndCardBoardId("p-1", board.id) } returns 0

        assertFailsWith<ConflictException> {
            useCase.execute("test1234", VoteRequest("card-1", "p-1"))
        }
    }

    @Test
    fun `投票上限超過で BadRequestException`() {
        val board = TestFixtures.board(phase = Phase.VOTING, maxVotesPerPerson = 3)
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { voteRepository.countByParticipantIdAndCardBoardId("p-1", board.id) } returns 3

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", VoteRequest("card-1", "p-1"))
        }
    }
}
