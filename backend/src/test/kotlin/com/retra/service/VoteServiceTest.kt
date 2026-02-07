package com.retra.service

import com.retra.TestFixtures
import com.retra.domain.model.Phase
import com.retra.domain.repository.CardRepository
import com.retra.domain.repository.ParticipantRepository
import com.retra.domain.repository.VoteRepository
import com.retra.dto.RemoveVoteRequest
import com.retra.dto.VoteRequest
import com.retra.exception.BadRequestException
import com.retra.exception.ConflictException
import com.retra.exception.NotFoundException
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.util.Optional
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class VoteServiceTest {

    private val voteRepository: VoteRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val participantRepository: ParticipantRepository = mockk()
    private val boardService: BoardService = mockk()
    private val eventPublisher: ApplicationEventPublisher = mockk(relaxed = true)

    private lateinit var voteService: VoteService

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        voteService = VoteService(voteRepository, cardRepository, participantRepository, boardService, eventPublisher)
    }

    @Nested
    inner class AddVote {

        @Test
        fun `VOTINGフェーズで投票成功`() {
            val board = TestFixtures.board(phase = Phase.VOTING, maxVotesPerPerson = 5)
            val card = TestFixtures.card(id = "card-1", board = board)
            val participant = TestFixtures.participant(id = "p-1")

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)
            every { participantRepository.findById("p-1") } returns Optional.of(participant)
            every { voteRepository.findByCardIdAndParticipantId("card-1", "p-1") } returns null
            every { voteRepository.countByParticipantIdAndCardBoardId("p-1", board.id) } returns 0
            every { voteRepository.save(any()) } answers { firstArg() }

            val request = VoteRequest("card-1", "p-1")
            val response = voteService.addVote("test1234", request)

            assertEquals("card-1", response.cardId)
            assertEquals("p-1", response.participantId)
            verify { eventPublisher.publishEvent(any<VoteAddedEvent>()) }
        }

        @Test
        fun `非VOTINGフェーズでBadRequestException`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            every { boardService.findBoardBySlug(any()) } returns board

            assertFailsWith<BadRequestException> {
                voteService.addVote("test1234", VoteRequest("card-1", "p-1"))
            }
        }

        @Test
        fun `重複投票でConflictException`() {
            val board = TestFixtures.board(phase = Phase.VOTING)
            val card = TestFixtures.card(id = "card-1", board = board)
            val participant = TestFixtures.participant(id = "p-1")
            val existingVote = TestFixtures.vote(card = card, participant = participant)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)
            every { participantRepository.findById("p-1") } returns Optional.of(participant)
            every { voteRepository.findByCardIdAndParticipantId("card-1", "p-1") } returns existingVote

            assertFailsWith<ConflictException> {
                voteService.addVote("test1234", VoteRequest("card-1", "p-1"))
            }
        }

        @Test
        fun `投票上限超過でBadRequestException`() {
            val board = TestFixtures.board(phase = Phase.VOTING, maxVotesPerPerson = 3)
            val card = TestFixtures.card(id = "card-1", board = board)
            val participant = TestFixtures.participant(id = "p-1")

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)
            every { participantRepository.findById("p-1") } returns Optional.of(participant)
            every { voteRepository.findByCardIdAndParticipantId("card-1", "p-1") } returns null
            every { voteRepository.countByParticipantIdAndCardBoardId("p-1", board.id) } returns 3

            assertFailsWith<BadRequestException> {
                voteService.addVote("test1234", VoteRequest("card-1", "p-1"))
            }
        }

        @Test
        fun `存在しないカードでNotFoundException`() {
            val board = TestFixtures.board(phase = Phase.VOTING)
            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("bad-card") } returns Optional.empty()

            assertFailsWith<NotFoundException> {
                voteService.addVote("test1234", VoteRequest("bad-card", "p-1"))
            }
        }

        @Test
        fun `別ボードのカードでBadRequestException`() {
            val board = TestFixtures.board(id = "board-1", phase = Phase.VOTING)
            val otherBoard = TestFixtures.board(id = "board-2")
            val card = TestFixtures.card(id = "card-1", board = otherBoard)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            assertFailsWith<BadRequestException> {
                voteService.addVote("test1234", VoteRequest("card-1", "p-1"))
            }
        }
    }

    @Nested
    inner class RemoveVote {

        @Test
        fun `VOTINGフェーズで投票取消成功`() {
            val board = TestFixtures.board(phase = Phase.VOTING)
            val vote = TestFixtures.vote()

            every { boardService.findBoardBySlug(any()) } returns board
            every { voteRepository.findByCardIdAndParticipantId("card-1", "p-1") } returns vote
            every { voteRepository.delete(any()) } just runs

            voteService.removeVote("test1234", RemoveVoteRequest("card-1", "p-1"))

            verify { voteRepository.delete(vote) }
            verify { eventPublisher.publishEvent(any<VoteRemovedEvent>()) }
        }

        @Test
        fun `非VOTINGフェーズでBadRequestException`() {
            val board = TestFixtures.board(phase = Phase.DISCUSSION)
            every { boardService.findBoardBySlug(any()) } returns board

            assertFailsWith<BadRequestException> {
                voteService.removeVote("test1234", RemoveVoteRequest("card-1", "p-1"))
            }
        }

        @Test
        fun `投票が存在しないでNotFoundException`() {
            val board = TestFixtures.board(phase = Phase.VOTING)
            every { boardService.findBoardBySlug(any()) } returns board
            every { voteRepository.findByCardIdAndParticipantId("card-1", "p-1") } returns null

            assertFailsWith<NotFoundException> {
                voteService.removeVote("test1234", RemoveVoteRequest("card-1", "p-1"))
            }
        }
    }

    @Nested
    inner class GetRemainingVotes {

        @Test
        fun `残投票数を正しく計算`() {
            val board = TestFixtures.board(maxVotesPerPerson = 5)
            every { boardService.findBoardBySlug(any()) } returns board
            every { voteRepository.countByParticipantIdAndCardBoardId("p-1", board.id) } returns 3

            val response = voteService.getRemainingVotes("test1234", "p-1")

            assertEquals("p-1", response.participantId)
            assertEquals(2, response.remaining)
            assertEquals(5, response.max)
            assertEquals(3, response.used)
        }

        @Test
        fun `使用済投票が上限超過でも残りは0以上`() {
            val board = TestFixtures.board(maxVotesPerPerson = 3)
            every { boardService.findBoardBySlug(any()) } returns board
            every { voteRepository.countByParticipantIdAndCardBoardId("p-1", board.id) } returns 5

            val response = voteService.getRemainingVotes("test1234", "p-1")

            assertEquals(0, response.remaining)
        }
    }
}
