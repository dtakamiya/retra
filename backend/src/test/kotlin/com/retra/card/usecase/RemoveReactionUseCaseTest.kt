package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.ReactionEvent
import com.retra.card.domain.ReactionRepository
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertFailsWith

class RemoveReactionUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val reactionRepository: ReactionRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: RemoveReactionUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = RemoveReactionUseCase(boardRepository, reactionRepository, eventPublisher)
    }

    @Test
    fun `リアクション削除成功`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(id = "p-1", board = board)
        val card = TestFixtures.card(id = "card-1", board = board)
        val reaction = TestFixtures.reaction(card = card, board = board, participant = participant, emoji = "👍")

        every { boardRepository.findBySlug(any()) } returns board
        every { reactionRepository.findByCardIdAndParticipantIdAndEmoji("card-1", "p-1", "👍") } returns reaction
        every { reactionRepository.delete(reaction) } just runs

        useCase.execute("test1234", RemoveReactionRequest("card-1", "p-1", "👍"))

        verify { reactionRepository.delete(reaction) }
        verify { eventPublisher.publish(match<ReactionEvent.ReactionRemoved> { it.emoji == "👍" && it.cardId == "card-1" }) }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", RemoveReactionRequest("card-1", "p-1", "👍"))
        }
    }

    @Test
    fun `存在しないリアクションで NotFoundException`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug(any()) } returns board
        every { reactionRepository.findByCardIdAndParticipantIdAndEmoji(any(), any(), any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", RemoveReactionRequest("card-1", "p-1", "👍"))
        }
    }

    @Test
    fun `別のボードのリアクションで NotFoundException`() {
        val board = TestFixtures.board(id = "board-1")
        val otherBoard = TestFixtures.board(id = "board-2")
        val card = TestFixtures.card(id = "card-1", board = otherBoard)
        val participant = TestFixtures.participant(id = "p-1", board = otherBoard)
        val reaction = TestFixtures.reaction(card = card, board = otherBoard, participant = participant, emoji = "👍")

        every { boardRepository.findBySlug(any()) } returns board
        every { reactionRepository.findByCardIdAndParticipantIdAndEmoji("card-1", "p-1", "👍") } returns reaction

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", RemoveReactionRequest("card-1", "p-1", "👍"))
        }
    }
}
