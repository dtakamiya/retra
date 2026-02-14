package com.retra.card.domain

import com.retra.TestFixtures
import com.retra.board.domain.Phase
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CardDiscussionTest {

    @Test
    fun `markAsDiscussed で isDiscussed が true になりイベントが返る`() {
        val board = TestFixtures.board(slug = "test-slug")
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)

        val event = card.markAsDiscussed()

        assertTrue(card.isDiscussed)
        assertEquals("test-slug", event.boardSlug)
        assertEquals("card-1", event.cardId)
        assertTrue(event.isDiscussed)
    }

    @Test
    fun `markAsDiscussed で updatedAt が更新される`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(board = board, column = column, updatedAt = "2024-01-01T00:00:00Z")

        card.markAsDiscussed()

        assertTrue(card.updatedAt != "2024-01-01T00:00:00Z")
    }

    @Test
    fun `unmarkAsDiscussed で isDiscussed が false になりイベントが返る`() {
        val board = TestFixtures.board(slug = "test-slug")
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(id = "card-1", board = board, column = column)
        card.markAsDiscussed()

        val event = card.unmarkAsDiscussed()

        assertFalse(card.isDiscussed)
        assertEquals("test-slug", event.boardSlug)
        assertEquals("card-1", event.cardId)
        assertFalse(event.isDiscussed)
    }

    @Test
    fun `unmarkAsDiscussed で updatedAt が更新される`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(board = board, column = column, updatedAt = "2024-01-01T00:00:00Z")

        card.markAsDiscussed()
        card.unmarkAsDiscussed()

        assertTrue(card.updatedAt > "2024-01-01T00:00:00Z")
    }

    @Test
    fun `Phase canMarkDiscussed は DISCUSSION で true`() {
        assertTrue(Phase.DISCUSSION.canMarkDiscussed())
    }

    @Test
    fun `Phase canMarkDiscussed は ACTION_ITEMS で true`() {
        assertTrue(Phase.ACTION_ITEMS.canMarkDiscussed())
    }

    @Test
    fun `Phase canMarkDiscussed は WRITING で false`() {
        assertFalse(Phase.WRITING.canMarkDiscussed())
    }

    @Test
    fun `Phase canMarkDiscussed は VOTING で false`() {
        assertFalse(Phase.VOTING.canMarkDiscussed())
    }

    @Test
    fun `Phase canMarkDiscussed は CLOSED で false`() {
        assertFalse(Phase.CLOSED.canMarkDiscussed())
    }
}
