package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.card.domain.Card
import com.retra.card.domain.CardRepository
import com.retra.board.domain.Phase
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class MoveCardUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val cardRepository: CardRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: MoveCardUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = MoveCardUseCase(boardRepository, cardRepository, eventPublisher)
    }

    @Test
    fun `DISCUSSIONフェーズでファシリテーターによる同カラム内並べ替え成功`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.columns.add(col1)
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = facilitator, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns emptyList()
        every { cardRepository.save(any()) } answers { firstArg() }

        useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 1, "p-1"))

        assertEquals("col-1", card.column?.id)
        assertEquals(1, card.sortOrder)
    }

    @Test
    fun `WRITINGフェーズで著者による同カラム内並べ替え`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board)
        board.columns.add(col1)
        board.participants.add(author)
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = author, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns emptyList()
        every { cardRepository.save(any()) } answers { firstArg() }

        useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 1, "p-1"))

        assertEquals(1, card.sortOrder)
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", "card-1", MoveCardRequest("col-2", 0, "p-1"))
        }
    }

    @Test
    fun `存在しないカードで NotFoundException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("bad-card") } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("test1234", "bad-card", MoveCardRequest("col-2", 0, "p-1"))
        }
    }

    @Test
    fun `カードが別のボードに属する場合 BadRequestException`() {
        val board = TestFixtures.board(id = "board-1", phase = Phase.DISCUSSION)
        val otherBoard = TestFixtures.board(id = "board-2", phase = Phase.DISCUSSION)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.columns.add(col1)
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = otherBoard, column = col1)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 0, "p-1"))
        }
    }

    @Test
    fun `WRITINGフェーズで著者によるクロスカラム移動成功`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val col2 = TestFixtures.boardColumn(id = "col-2", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board)
        board.columns.addAll(listOf(col1, col2))
        board.participants.add(author)
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = author, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-2") } returns emptyList()
        every { cardRepository.save(any()) } answers { firstArg() }

        useCase.execute("test1234", "card-1", MoveCardRequest("col-2", 0, "p-1"))

        assertEquals("col-2", card.column?.id)
        assertEquals(0, card.sortOrder)
    }

    @Test
    fun `移動先に既存カードがある場合にsortOrderが再計算される`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.columns.add(col1)
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = facilitator, sortOrder = 0)
        val existingCard = TestFixtures.card(id = "card-2", board = board, column = col1, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns listOf(existingCard)
        every { cardRepository.saveAll(any<List<Card>>()) } just Runs
        every { cardRepository.save(any()) } answers { firstArg() }

        useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 0, "p-1"))

        assertEquals(0, card.sortOrder)
        verify { eventPublisher.publishAll(any()) }
    }

    @Test
    fun `DISCUSSIONフェーズでクロスカラム移動はBadRequestException`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val col2 = TestFixtures.boardColumn(id = "col-2", board = board)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.columns.addAll(listOf(col1, col2))
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = facilitator, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", MoveCardRequest("col-2", 0, "p-1"))
        }
    }

    @Test
    fun `VOTINGフェーズでカード移動はBadRequestException`() {
        val board = TestFixtures.board(phase = Phase.VOTING)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board)
        board.columns.add(col1)
        board.participants.add(author)
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = author, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<BadRequestException> {
            useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 1, "p-1"))
        }
    }

    @Test
    fun `WRITINGフェーズで非著者が移動するとForbiddenException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board)
        val otherUser = TestFixtures.participant(id = "p-2", board = board)
        board.columns.add(col1)
        board.participants.addAll(listOf(author, otherUser))
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = author, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card

        assertFailsWith<ForbiddenException> {
            useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 1, "p-2"))
        }
    }

    @Test
    fun `移動先に複数の既存カードがある場合にsortOrderの再計算で一部が更新不要`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.columns.add(col1)
        board.participants.add(facilitator)
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = facilitator, sortOrder = 0)
        // 既存カード: sortOrder 0 と 1 がある場合、sortOrder 1 に挿入
        // index 0 (card-2): index < sortOrder(1) -> newOrder=0, sortOrder=0 -> 変更なし(null)
        // index 1 (card-3): index >= sortOrder(1) -> newOrder=2, sortOrder=1 -> 変更あり
        val existingCard2 = TestFixtures.card(id = "card-2", board = board, column = col1, sortOrder = 0)
        val existingCard3 = TestFixtures.card(id = "card-3", board = board, column = col1, sortOrder = 1)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns listOf(existingCard2, existingCard3)
        every { cardRepository.saveAll(any<List<Card>>()) } just Runs
        every { cardRepository.save(any()) } answers { firstArg() }

        useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 1, "p-1"))

        assertEquals(1, card.sortOrder)
        // existingCard2: index=0, sortOrder=1の場合 0 < 1なのでnewOrder=0 -> 変更なし
        assertEquals(0, existingCard2.sortOrder)
        // existingCard3: index=1, sortOrder=1の場合 1 >= 1なのでnewOrder=2 -> 変更あり
        assertEquals(2, existingCard3.sortOrder)
    }

    @Test
    fun `participantがnullのカードでも移動処理が動作する`() {
        val board = TestFixtures.board(phase = Phase.DISCUSSION)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.columns.add(col1)
        board.participants.add(facilitator)
        // participantがnullのカード
        val card = TestFixtures.card(id = "card-1", board = board, column = col1, participant = null, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns emptyList()
        every { cardRepository.save(any()) } answers { firstArg() }

        useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 0, "p-1"))

        assertEquals(0, card.sortOrder)
    }

    @Test
    fun `columnがnullのカードでもsourceColumnIdが空文字として扱われる`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val author = TestFixtures.participant(id = "p-1", board = board)
        board.columns.add(col1)
        board.participants.add(author)
        // columnがnullのカード（WRITINGフェーズなら著者によるクロスカラム移動が許可される）
        val card = TestFixtures.card(id = "card-1", board = board, column = null, participant = author, sortOrder = 0)

        every { boardRepository.findBySlug(any()) } returns board
        every { cardRepository.findById("card-1") } returns card
        every { cardRepository.findByColumnIdOrderBySortOrderAsc("col-1") } returns emptyList()
        every { cardRepository.save(any()) } answers { firstArg() }

        useCase.execute("test1234", "card-1", MoveCardRequest("col-1", 0, "p-1"))

        assertEquals("col-1", card.column?.id)
    }
}
