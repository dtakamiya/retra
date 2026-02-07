package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.card.domain.CardRepository
import com.retra.card.domain.ReactionEvent
import com.retra.card.domain.ReactionRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ConflictException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AddReactionUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val reactionRepository: ReactionRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: AddReactionUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = AddReactionUseCase(boardRepository, cardRepository, reactionRepository, eventPublisher)
    }

    @Test
    fun `リアクション追加成功`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { reactionRepository.findByCardIdAndParticipantIdAndEmoji("card-1", "p-1", "👍") } returns null
        every { reactionRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", AddReactionRequest("card-1", "p-1", "👍"))

        assertEquals("card-1", response.cardId)
        assertEquals("p-1", response.participantId)
        assertEquals("👍", response.emoji)
        verify { eventPublisher.publish(match<ReactionEvent.ReactionAdded> { it.emoji == "👍" }) }
    }

    @Test
    fun `全フェーズでリアクション可能`() {
        Phase.entries.forEach { phase ->
            clearAllMocks()
            val board = TestFixtures.board(phase = phase)
            val participant = TestFixtures.participant(id = "p-1", board = board)
            board.participants.add(participant)
            val card = TestFixtures.card(id = "card-1", board = board)

            every { boardRepository.findBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns card
            every { reactionRepository.findByCardIdAndParticipantIdAndEmoji(any(), any(), any()) } returns null
            every { reactionRepository.save(any()) } answers { firstArg() }

            val response = useCase.execute("test1234", AddReactionRequest("card-1", "p-1", "👍"))
            assertEquals("👍", response.emoji, "Phase $phase should allow reactions")
        }
    }

    @Test
    fun `不正な絵文字で BadRequestException`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", AddReactionRequest("card-1", "p-1", "💩"))
        }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", AddReactionRequest("card-1", "p-1", "👍"))
        }
    }

    @Test
    fun `存在しないカードで NotFoundException`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", AddReactionRequest("card-1", "p-1", "👍"))
        }
    }

    @Test
    fun `別のボードのカードで BadRequestException`() {
        val board = TestFixtures.board(id = "board-1")
        val otherBoard = TestFixtures.board(id = "board-2")
        val card = TestFixtures.card(id = "card-1", board = otherBoard)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", AddReactionRequest("card-1", "p-1", "👍"))
        }
    }

    @Test
    fun `重複リアクションで ConflictException`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board)
        val existingReaction = TestFixtures.reaction(card = card, participant = participant, emoji = "👍")

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { reactionRepository.findByCardIdAndParticipantIdAndEmoji("card-1", "p-1", "👍") } returns existingReaction

        assertFailsWith<ConflictException> {
            useCase.execute("test1234", AddReactionRequest("card-1", "p-1", "👍"))
        }
    }

    @Test
    fun `同じカードに異なる絵文字でリアクション可能`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)
        val card = TestFixtures.card(id = "card-1", board = board)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { reactionRepository.findByCardIdAndParticipantIdAndEmoji("card-1", "p-1", "❤️") } returns null
        every { reactionRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", AddReactionRequest("card-1", "p-1", "❤️"))
        assertEquals("❤️", response.emoji)
    }
}
