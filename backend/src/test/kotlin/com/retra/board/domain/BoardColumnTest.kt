package com.retra.board.domain

import com.retra.TestFixtures
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class BoardColumnTest {

    @Test
    fun `デフォルト値でBoardColumnが作成される`() {
        val column = BoardColumn()

        assertNotNull(column.id)
        assertEquals("", column.name)
        assertEquals(0, column.sortOrder)
        assertEquals("#6366f1", column.color)
        assertEquals(null, column.board)
        assertTrue(column.cards.isEmpty())
    }

    @Test
    fun `指定した値でBoardColumnが作成される`() {
        val board = TestFixtures.board()
        val column = BoardColumn(
            id = "col-1",
            board = board,
            name = "Keep",
            sortOrder = 0,
            color = "#22c55e"
        )

        assertEquals("col-1", column.id)
        assertEquals(board, column.board)
        assertEquals("Keep", column.name)
        assertEquals(0, column.sortOrder)
        assertEquals("#22c55e", column.color)
    }

    @Test
    fun `cardsリストにカードを追加できる`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(column = column, board = board)

        column.cards.add(card)

        assertEquals(1, column.cards.size)
        assertEquals(card, column.cards[0])
    }

    @Test
    fun `プロパティを変更できる`() {
        val column = BoardColumn()
        column.name = "Problem"
        column.sortOrder = 2
        column.color = "#ef4444"

        assertEquals("Problem", column.name)
        assertEquals(2, column.sortOrder)
        assertEquals("#ef4444", column.color)
    }

    @Test
    fun `boardプロパティを設定できる`() {
        val column = BoardColumn()
        val board = TestFixtures.board()

        column.board = board

        assertEquals(board, column.board)
    }
}
