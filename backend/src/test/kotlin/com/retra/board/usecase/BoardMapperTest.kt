package com.retra.board.usecase

import com.retra.TestFixtures
import com.retra.board.domain.Phase
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class BoardMapperTest {

    @Test
    fun `プライベート記述モードOFF時は全カードが表示される`() {
        val board = TestFixtures.board(phase = Phase.WRITING, privateWriting = false)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant1 = TestFixtures.participant(id = "p-1", board = board)
        val participant2 = TestFixtures.participant(id = "p-2", board = board)
        val card1 = TestFixtures.card(id = "card-1", column = column, board = board, participant = participant1)
        val card2 = TestFixtures.card(id = "card-2", column = column, board = board, participant = participant2)
        board.columns.add(column)
        board.participants.add(participant1)
        board.participants.add(participant2)
        column.cards.add(card1)
        column.cards.add(card2)

        val response = BoardMapper.toBoardResponse(board, requesterId = "p-1")

        assertEquals(2, response.columns[0].cards.size)
        assertEquals(0, response.columns[0].hiddenCardCount)
    }

    @Test
    fun `プライベート記述モードON_WRITINGフェーズ_requesterIdあり 自分のカードのみ表示`() {
        val board = TestFixtures.board(phase = Phase.WRITING, privateWriting = true)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant1 = TestFixtures.participant(id = "p-1", board = board)
        val participant2 = TestFixtures.participant(id = "p-2", board = board)
        val myCard = TestFixtures.card(id = "card-1", column = column, board = board, participant = participant1, sortOrder = 0)
        val otherCard = TestFixtures.card(id = "card-2", column = column, board = board, participant = participant2, sortOrder = 1)
        board.columns.add(column)
        board.participants.add(participant1)
        board.participants.add(participant2)
        column.cards.add(myCard)
        column.cards.add(otherCard)

        val response = BoardMapper.toBoardResponse(board, requesterId = "p-1")

        assertEquals(1, response.columns[0].cards.size)
        assertEquals("card-1", response.columns[0].cards[0].id)
        assertEquals(1, response.columns[0].hiddenCardCount)
    }

    @Test
    fun `プライベート記述モードON_WRITINGフェーズ_requesterIdなし カードは空でhiddenCardCountが全件数`() {
        val board = TestFixtures.board(phase = Phase.WRITING, privateWriting = true)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant1 = TestFixtures.participant(id = "p-1", board = board)
        val participant2 = TestFixtures.participant(id = "p-2", board = board)
        val card1 = TestFixtures.card(id = "card-1", column = column, board = board, participant = participant1)
        val card2 = TestFixtures.card(id = "card-2", column = column, board = board, participant = participant2)
        board.columns.add(column)
        board.participants.add(participant1)
        board.participants.add(participant2)
        column.cards.add(card1)
        column.cards.add(card2)

        val response = BoardMapper.toBoardResponse(board, requesterId = null)

        assertEquals(0, response.columns[0].cards.size)
        assertEquals(2, response.columns[0].hiddenCardCount)
    }

    @Test
    fun `プライベート記述モードON_VOTINGフェーズ 全カードが表示される`() {
        val board = TestFixtures.board(phase = Phase.VOTING, privateWriting = true)
        val column = TestFixtures.boardColumn(id = "col-1", board = board)
        val participant1 = TestFixtures.participant(id = "p-1", board = board)
        val participant2 = TestFixtures.participant(id = "p-2", board = board)
        val card1 = TestFixtures.card(id = "card-1", column = column, board = board, participant = participant1)
        val card2 = TestFixtures.card(id = "card-2", column = column, board = board, participant = participant2)
        board.columns.add(column)
        board.participants.add(participant1)
        board.participants.add(participant2)
        column.cards.add(card1)
        column.cards.add(card2)

        val response = BoardMapper.toBoardResponse(board, requesterId = "p-1")

        assertEquals(2, response.columns[0].cards.size)
        assertEquals(0, response.columns[0].hiddenCardCount)
    }
}
