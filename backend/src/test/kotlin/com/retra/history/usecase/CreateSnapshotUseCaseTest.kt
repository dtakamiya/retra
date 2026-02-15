package com.retra.history.usecase

import com.retra.TestFixtures
import com.retra.actionitem.domain.ActionItem
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.Framework
import com.retra.board.domain.Phase
import com.retra.history.domain.BoardSnapshot
import com.retra.history.domain.BoardSnapshotRepository
import com.fasterxml.jackson.databind.ObjectMapper
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class CreateSnapshotUseCaseTest {

    private val snapshotRepository: BoardSnapshotRepository = mockk()
    private val actionItemRepository: ActionItemRepository = mockk()
    private val objectMapper: ObjectMapper = ObjectMapper()
    private lateinit var useCase: CreateSnapshotUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = CreateSnapshotUseCase(snapshotRepository, actionItemRepository, objectMapper)
    }

    @Test
    fun `ボードのスナップショットを正しい集計データで作成する`() {
        val board = TestFixtures.board(phase = Phase.CLOSED, framework = Framework.KPT)
        val column1 = TestFixtures.boardColumn(id = "col-1", board = board, name = "Keep", sortOrder = 0)
        val column2 = TestFixtures.boardColumn(id = "col-2", board = board, name = "Problem", sortOrder = 1)
        board.columns.addAll(listOf(column1, column2))

        val participant1 = TestFixtures.participant(id = "p-1", board = board, nickname = "User1")
        val participant2 = TestFixtures.participant(id = "p-2", board = board, nickname = "User2")
        board.participants.addAll(listOf(participant1, participant2))

        val card1 = TestFixtures.card(id = "c-1", column = column1, board = board, content = "Good teamwork")
        val vote1 = TestFixtures.vote(card = card1, participant = participant1)
        val vote2 = TestFixtures.vote(card = card1, participant = participant2)
        card1.votes.addAll(listOf(vote1, vote2))

        val card2 = TestFixtures.card(id = "c-2", column = column2, board = board, content = "Slow builds")
        val vote3 = TestFixtures.vote(card = card2, participant = participant1)
        card2.votes.add(vote3)

        board.cards.addAll(listOf(card1, card2))

        val actionItems = listOf(
            TestFixtures.actionItem(board = board, content = "Fix builds", status = ActionItemStatus.DONE),
            TestFixtures.actionItem(board = board, content = "Improve CI", status = ActionItemStatus.OPEN),
            TestFixtures.actionItem(board = board, content = "Add tests", status = ActionItemStatus.DONE)
        )

        every { actionItemRepository.findByBoardId(board.id) } returns actionItems
        val snapshotSlot = slot<BoardSnapshot>()
        every { snapshotRepository.save(capture(snapshotSlot)) } answers { firstArg() }

        useCase.execute(board)

        verify(exactly = 1) { snapshotRepository.save(any()) }
        val savedSnapshot = snapshotSlot.captured
        assertEquals(board.id, savedSnapshot.boardId)
        assertEquals(board.title, savedSnapshot.teamName)
        assertEquals("KPT", savedSnapshot.framework)
        assertEquals(2, savedSnapshot.totalCards)
        assertEquals(3, savedSnapshot.totalVotes)
        assertEquals(2, savedSnapshot.totalParticipants)
        assertEquals(3, savedSnapshot.actionItemsTotal)
        assertEquals(2, savedSnapshot.actionItemsDone)
        assertTrue(savedSnapshot.snapshotData.contains("\"columns\""))
        assertTrue(savedSnapshot.snapshotData.contains("Keep"))
        assertTrue(savedSnapshot.snapshotData.contains("Problem"))
    }

    @Test
    fun `アクションアイテムがない場合のスナップショット作成`() {
        val board = TestFixtures.board(phase = Phase.CLOSED)
        val column = TestFixtures.boardColumn(id = "col-1", board = board, name = "Keep")
        board.columns.add(column)

        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)

        val card = TestFixtures.card(id = "c-1", column = column, board = board)
        board.cards.add(card)

        every { actionItemRepository.findByBoardId(board.id) } returns emptyList()
        val snapshotSlot = slot<BoardSnapshot>()
        every { snapshotRepository.save(capture(snapshotSlot)) } answers { firstArg() }

        useCase.execute(board)

        val savedSnapshot = snapshotSlot.captured
        assertEquals(1, savedSnapshot.totalCards)
        assertEquals(0, savedSnapshot.totalVotes)
        assertEquals(1, savedSnapshot.totalParticipants)
        assertEquals(0, savedSnapshot.actionItemsTotal)
        assertEquals(0, savedSnapshot.actionItemsDone)
    }

    @Test
    fun `一部のアクションアイテムが完了済みの場合のスナップショット作成`() {
        val board = TestFixtures.board(phase = Phase.CLOSED)
        board.columns.add(TestFixtures.boardColumn(board = board))
        board.participants.add(TestFixtures.participant(board = board))

        val actionItems = listOf(
            TestFixtures.actionItem(board = board, status = ActionItemStatus.DONE),
            TestFixtures.actionItem(board = board, status = ActionItemStatus.IN_PROGRESS),
            TestFixtures.actionItem(board = board, status = ActionItemStatus.OPEN),
            TestFixtures.actionItem(board = board, status = ActionItemStatus.DONE)
        )

        every { actionItemRepository.findByBoardId(board.id) } returns actionItems
        val snapshotSlot = slot<BoardSnapshot>()
        every { snapshotRepository.save(capture(snapshotSlot)) } answers { firstArg() }

        useCase.execute(board)

        val savedSnapshot = snapshotSlot.captured
        assertEquals(4, savedSnapshot.actionItemsTotal)
        assertEquals(2, savedSnapshot.actionItemsDone)
    }

    @Test
    fun `teamNameが設定されている場合はteamNameを使用する`() {
        val board = TestFixtures.board(phase = Phase.CLOSED, teamName = "チーム Alpha")
        val column = TestFixtures.boardColumn(id = "col-1", board = board, name = "Keep")
        board.columns.add(column)

        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)

        val card = TestFixtures.card(id = "c-1", column = column, board = board)
        board.cards.add(card)

        every { actionItemRepository.findByBoardId(board.id) } returns emptyList()
        val snapshotSlot = slot<BoardSnapshot>()
        every { snapshotRepository.save(capture(snapshotSlot)) } answers { firstArg() }

        useCase.execute(board)

        verify(exactly = 1) { snapshotRepository.save(any()) }
        val savedSnapshot = snapshotSlot.captured
        assertEquals("チーム Alpha", savedSnapshot.teamName)
    }

    @Test
    fun `teamNameが未設定の場合はtitleを使用する`() {
        val board = TestFixtures.board(phase = Phase.CLOSED, title = "Sprint 42 Retro", teamName = null)
        val column = TestFixtures.boardColumn(id = "col-1", board = board, name = "Keep")
        board.columns.add(column)

        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)

        val card = TestFixtures.card(id = "c-1", column = column, board = board)
        board.cards.add(card)

        every { actionItemRepository.findByBoardId(board.id) } returns emptyList()
        val snapshotSlot = slot<BoardSnapshot>()
        every { snapshotRepository.save(capture(snapshotSlot)) } answers { firstArg() }

        useCase.execute(board)

        verify(exactly = 1) { snapshotRepository.save(any()) }
        val savedSnapshot = snapshotSlot.captured
        assertEquals("Sprint 42 Retro", savedSnapshot.teamName)
    }

    @Test
    fun `スナップショットデータにカラムとカードの情報が含まれる`() {
        val board = TestFixtures.board(phase = Phase.CLOSED, framework = Framework.KPT)
        val column = TestFixtures.boardColumn(id = "col-1", board = board, name = "Keep", sortOrder = 0)
        board.columns.add(column)

        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)

        val card = TestFixtures.card(id = "c-1", column = column, board = board, content = "Great collaboration")
        val vote = TestFixtures.vote(card = card, participant = participant)
        card.votes.add(vote)
        board.cards.add(card)

        every { actionItemRepository.findByBoardId(board.id) } returns emptyList()
        val snapshotSlot = slot<BoardSnapshot>()
        every { snapshotRepository.save(capture(snapshotSlot)) } answers { firstArg() }

        useCase.execute(board)

        val snapshotData = snapshotSlot.captured.snapshotData
        assertTrue(snapshotData.contains("\"columns\""))
        assertTrue(snapshotData.contains("\"name\":\"Keep\""))
        assertTrue(snapshotData.contains("\"content\":\"Great collaboration\""))
        assertTrue(snapshotData.contains("\"votes\":1"))
    }
}
