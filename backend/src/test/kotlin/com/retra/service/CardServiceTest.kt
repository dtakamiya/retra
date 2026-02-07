package com.retra.service

import com.retra.TestFixtures
import com.retra.domain.model.Card
import com.retra.domain.model.Phase
import com.retra.domain.repository.BoardColumnRepository
import com.retra.domain.repository.CardRepository
import com.retra.domain.repository.ParticipantRepository
import com.retra.dto.CreateCardRequest
import com.retra.dto.DeleteCardRequest
import com.retra.dto.MoveCardRequest
import com.retra.dto.UpdateCardRequest
import com.retra.exception.BadRequestException
import com.retra.exception.ForbiddenException
import com.retra.exception.NotFoundException
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.util.Optional
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class CardServiceTest {

    private val cardRepository: CardRepository = mockk()
    private val columnRepository: BoardColumnRepository = mockk()
    private val participantRepository: ParticipantRepository = mockk()
    private val boardService: BoardService = mockk()
    private val eventPublisher: ApplicationEventPublisher = mockk(relaxed = true)

    private lateinit var cardService: CardService

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        cardService = CardService(cardRepository, columnRepository, participantRepository, boardService, eventPublisher)
    }

    @Nested
    inner class CreateCard {

        @Test
        fun `WRITINGフェーズでカード作成成功`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            val column = TestFixtures.boardColumn(id = "col-1", board = board)
            val participant = TestFixtures.participant(id = "p-1", nickname = "User1")

            every { boardService.findBoardBySlug(any()) } returns board
            every { columnRepository.findById("col-1") } returns Optional.of(column)
            every { participantRepository.findById("p-1") } returns Optional.of(participant)
            every { cardRepository.countByColumnId("col-1") } returns 0L
            every { cardRepository.save(any()) } answers { firstArg() }

            val request = CreateCardRequest("col-1", "New card", "p-1")
            val response = cardService.createCard("test1234", request)

            assertEquals("New card", response.content)
            assertEquals("User1", response.authorNickname)
            assertEquals("col-1", response.columnId)
            verify { eventPublisher.publishEvent(any<CardCreatedEvent>()) }
        }

        @Test
        fun `非WRITINGフェーズでBadRequestException`() {
            val board = TestFixtures.board(phase = Phase.VOTING)
            every { boardService.findBoardBySlug(any()) } returns board

            val request = CreateCardRequest("col-1", "Card", "p-1")
            assertFailsWith<BadRequestException> {
                cardService.createCard("test1234", request)
            }
        }

        @Test
        fun `存在しないカラムでNotFoundException`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            every { boardService.findBoardBySlug(any()) } returns board
            every { columnRepository.findById("bad-col") } returns Optional.empty()

            val request = CreateCardRequest("bad-col", "Card", "p-1")
            assertFailsWith<NotFoundException> {
                cardService.createCard("test1234", request)
            }
        }

        @Test
        fun `別ボードのカラムでBadRequestException`() {
            val board = TestFixtures.board(id = "board-1", phase = Phase.WRITING)
            val otherBoard = TestFixtures.board(id = "board-2")
            val column = TestFixtures.boardColumn(id = "col-1", board = otherBoard)

            every { boardService.findBoardBySlug(any()) } returns board
            every { columnRepository.findById("col-1") } returns Optional.of(column)

            val request = CreateCardRequest("col-1", "Card", "p-1")
            assertFailsWith<BadRequestException> {
                cardService.createCard("test1234", request)
            }
        }

        @Test
        fun `存在しない参加者でNotFoundException`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            val column = TestFixtures.boardColumn(id = "col-1", board = board)

            every { boardService.findBoardBySlug(any()) } returns board
            every { columnRepository.findById("col-1") } returns Optional.of(column)
            every { participantRepository.findById("bad-p") } returns Optional.empty()

            val request = CreateCardRequest("col-1", "Card", "bad-p")
            assertFailsWith<NotFoundException> {
                cardService.createCard("test1234", request)
            }
        }
    }

    @Nested
    inner class UpdateCard {

        @Test
        fun `著者がカード更新成功`() {
            val board = TestFixtures.board()
            val participant = TestFixtures.participant(id = "p-1")
            val card = TestFixtures.card(id = "card-1", board = board, participant = participant)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)
            every { cardRepository.save(any()) } answers { firstArg() }

            val request = UpdateCardRequest("Updated content", "p-1")
            val response = cardService.updateCard("test1234", "card-1", request)

            assertEquals("Updated content", response.content)
            verify { eventPublisher.publishEvent(any<CardUpdatedEvent>()) }
        }

        @Test
        fun `非著者はカード編集不可`() {
            val board = TestFixtures.board()
            val author = TestFixtures.participant(id = "p-1")
            val card = TestFixtures.card(id = "card-1", board = board, participant = author)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            val request = UpdateCardRequest("Updated", "p-2")
            assertFailsWith<ForbiddenException> {
                cardService.updateCard("test1234", "card-1", request)
            }
        }

        @Test
        fun `別ボードのカード更新でBadRequestException`() {
            val board = TestFixtures.board(id = "board-1")
            val otherBoard = TestFixtures.board(id = "board-2")
            val card = TestFixtures.card(id = "card-1", board = otherBoard)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            val request = UpdateCardRequest("Updated", "p-1")
            assertFailsWith<BadRequestException> {
                cardService.updateCard("test1234", "card-1", request)
            }
        }
    }

    @Nested
    inner class DeleteCard {

        @Test
        fun `著者がカード削除成功`() {
            val board = TestFixtures.board()
            val participant = TestFixtures.participant(id = "p-1", board = board, isFacilitator = false)
            board.participants.add(participant)
            val column = TestFixtures.boardColumn(id = "col-1", board = board)
            val card = TestFixtures.card(id = "card-1", column = column, board = board, participant = participant)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)
            every { cardRepository.delete(any()) } just runs

            cardService.deleteCard("test1234", "card-1", DeleteCardRequest("p-1"))

            verify { cardRepository.delete(card) }
            verify { eventPublisher.publishEvent(any<CardDeletedEvent>()) }
        }

        @Test
        fun `ファシリテーターが他人のカード削除成功`() {
            val board = TestFixtures.board()
            val author = TestFixtures.participant(id = "p-1", board = board, isFacilitator = false)
            val facilitator = TestFixtures.participant(id = "p-2", board = board, isFacilitator = true)
            board.participants.addAll(listOf(author, facilitator))
            val column = TestFixtures.boardColumn(id = "col-1", board = board)
            val card = TestFixtures.card(id = "card-1", column = column, board = board, participant = author)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)
            every { cardRepository.delete(any()) } just runs

            cardService.deleteCard("test1234", "card-1", DeleteCardRequest("p-2"))

            verify { cardRepository.delete(card) }
        }

        @Test
        fun `非著者かつ非ファシリテーターでForbiddenException`() {
            val board = TestFixtures.board()
            val author = TestFixtures.participant(id = "p-1", board = board, isFacilitator = false)
            val other = TestFixtures.participant(id = "p-3", board = board, isFacilitator = false)
            board.participants.addAll(listOf(author, other))
            val card = TestFixtures.card(id = "card-1", board = board, participant = author)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            assertFailsWith<ForbiddenException> {
                cardService.deleteCard("test1234", "card-1", DeleteCardRequest("p-3"))
            }
        }

        @Test
        fun `存在しないカード削除でNotFoundException`() {
            val board = TestFixtures.board()
            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("bad-card") } returns Optional.empty()

            assertFailsWith<NotFoundException> {
                cardService.deleteCard("test1234", "bad-card", DeleteCardRequest("p-1"))
            }
        }

        @Test
        fun `参加者が見つからない場合NotFoundException`() {
            val board = TestFixtures.board()
            val card = TestFixtures.card(id = "card-1", board = board)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            assertFailsWith<NotFoundException> {
                cardService.deleteCard("test1234", "card-1", DeleteCardRequest("unknown"))
            }
        }
    }

    @Nested
    inner class MoveCard {

        @Test
        fun `WRITINGフェーズで著者がカラム内並べ替え成功`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            val author = TestFixtures.participant(id = "p-1", board = board, isFacilitator = false)
            board.participants.add(author)
            val column = TestFixtures.boardColumn(id = "col-1", board = board)
            val card1 = TestFixtures.card(id = "card-1", column = column, board = board, participant = author, sortOrder = 0)
            val card2 = TestFixtures.card(id = "card-2", column = column, board = board, participant = author, sortOrder = 1)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-2") } returns Optional.of(card2)
            every { columnRepository.findById("col-1") } returns Optional.of(column)
            every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns listOf(card1, card2)
            every { cardRepository.saveAll(any<List<Card>>()) } answers { firstArg() }
            every { cardRepository.save(any()) } answers { firstArg() }

            val request = MoveCardRequest("col-1", 0, "p-1")
            cardService.moveCard("test1234", "card-2", request)

            verify { cardRepository.saveAll(match<List<Card>> { cards -> cards.any { it.id == "card-1" && it.sortOrder == 1 } }) }
            verify { cardRepository.save(match { it.id == "card-2" && it.sortOrder == 0 }) }
            verify { eventPublisher.publishEvent(any<CardMovedEvent>()) }
        }

        @Test
        fun `WRITINGフェーズで著者がカラム間移動成功`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            val author = TestFixtures.participant(id = "p-1", board = board, isFacilitator = false)
            board.participants.add(author)
            val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
            val col2 = TestFixtures.boardColumn(id = "col-2", board = board)
            val card = TestFixtures.card(id = "card-1", column = col1, board = board, participant = author, sortOrder = 0)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)
            every { columnRepository.findById("col-2") } returns Optional.of(col2)
            every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-2") } returns emptyList()
            every { cardRepository.save(any()) } answers { firstArg() }

            val request = MoveCardRequest("col-2", 0, "p-1")
            cardService.moveCard("test1234", "card-1", request)

            verify { cardRepository.save(match { it.id == "card-1" && it.column?.id == "col-2" && it.sortOrder == 0 }) }
            verify { eventPublisher.publishEvent(any<CardMovedEvent>()) }
        }

        @Test
        fun `DISCUSSIONフェーズでファシリテーターが並べ替え成功`() {
            val board = TestFixtures.board(phase = Phase.DISCUSSION)
            val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
            board.participants.add(facilitator)
            val column = TestFixtures.boardColumn(id = "col-1", board = board)
            val card = TestFixtures.card(id = "card-1", column = column, board = board, sortOrder = 0)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)
            every { columnRepository.findById("col-1") } returns Optional.of(column)
            every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns listOf(card)
            every { cardRepository.save(any()) } answers { firstArg() }

            val request = MoveCardRequest("col-1", 0, "p-1")
            cardService.moveCard("test1234", "card-1", request)

            verify { eventPublisher.publishEvent(any<CardMovedEvent>()) }
        }

        @Test
        fun `VOTINGフェーズでBadRequestException`() {
            val board = TestFixtures.board(phase = Phase.VOTING)
            val participant = TestFixtures.participant(id = "p-1", board = board)
            board.participants.add(participant)
            val column = TestFixtures.boardColumn(id = "col-1", board = board)
            val card = TestFixtures.card(id = "card-1", column = column, board = board, participant = participant)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            assertFailsWith<BadRequestException> {
                cardService.moveCard("test1234", "card-1", MoveCardRequest("col-1", 0, "p-1"))
            }
        }

        @Test
        fun `CLOSEDフェーズでBadRequestException`() {
            val board = TestFixtures.board(phase = Phase.CLOSED)
            val participant = TestFixtures.participant(id = "p-1", board = board)
            board.participants.add(participant)
            val card = TestFixtures.card(id = "card-1", board = board, participant = participant)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            assertFailsWith<BadRequestException> {
                cardService.moveCard("test1234", "card-1", MoveCardRequest("col-1", 0, "p-1"))
            }
        }

        @Test
        fun `WRITINGフェーズで非著者が移動するとForbiddenException`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            val author = TestFixtures.participant(id = "p-1", board = board, isFacilitator = false)
            val other = TestFixtures.participant(id = "p-2", board = board, isFacilitator = false)
            board.participants.addAll(listOf(author, other))
            val column = TestFixtures.boardColumn(id = "col-1", board = board)
            val card = TestFixtures.card(id = "card-1", column = column, board = board, participant = author)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            assertFailsWith<ForbiddenException> {
                cardService.moveCard("test1234", "card-1", MoveCardRequest("col-1", 0, "p-2"))
            }
        }

        @Test
        fun `DISCUSSIONフェーズで非ファシリテーターが移動するとForbiddenException`() {
            val board = TestFixtures.board(phase = Phase.DISCUSSION)
            val participant = TestFixtures.participant(id = "p-1", board = board, isFacilitator = false)
            board.participants.add(participant)
            val column = TestFixtures.boardColumn(id = "col-1", board = board)
            val card = TestFixtures.card(id = "card-1", column = column, board = board)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            assertFailsWith<ForbiddenException> {
                cardService.moveCard("test1234", "card-1", MoveCardRequest("col-1", 0, "p-1"))
            }
        }

        @Test
        fun `DISCUSSIONフェーズでカラム間移動するとBadRequestException`() {
            val board = TestFixtures.board(phase = Phase.DISCUSSION)
            val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
            board.participants.add(facilitator)
            val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
            val card = TestFixtures.card(id = "card-1", column = col1, board = board)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)

            assertFailsWith<BadRequestException> {
                cardService.moveCard("test1234", "card-1", MoveCardRequest("col-2", 0, "p-1"))
            }
        }

        @Test
        fun `存在しないカードでNotFoundException`() {
            val board = TestFixtures.board(phase = Phase.WRITING)
            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("bad-card") } returns Optional.empty()

            assertFailsWith<NotFoundException> {
                cardService.moveCard("test1234", "bad-card", MoveCardRequest("col-1", 0, "p-1"))
            }
        }

        @Test
        fun `別ボードのターゲットカラムでBadRequestException`() {
            val board = TestFixtures.board(id = "board-1", phase = Phase.WRITING)
            val author = TestFixtures.participant(id = "p-1", board = board, isFacilitator = false)
            board.participants.add(author)
            val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
            val card = TestFixtures.card(id = "card-1", column = col1, board = board, participant = author)
            val otherBoard = TestFixtures.board(id = "board-2")
            val otherCol = TestFixtures.boardColumn(id = "col-other", board = otherBoard)

            every { boardService.findBoardBySlug(any()) } returns board
            every { cardRepository.findById("card-1") } returns Optional.of(card)
            every { columnRepository.findById("col-other") } returns Optional.of(otherCol)

            assertFailsWith<BadRequestException> {
                cardService.moveCard("test1234", "card-1", MoveCardRequest("col-other", 0, "p-1"))
            }
        }
    }
}
