package com.retra.card.domain

import com.retra.TestFixtures
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class ReactionTest {

    @Test
    fun `デフォルトコンストラクタでIDが生成される`() {
        val reaction = Reaction()
        assertNotNull(reaction.id)
        assertNull(reaction.card)
        assertNull(reaction.board)
        assertNull(reaction.participant)
        assertEquals("", reaction.emoji)
        assertNotNull(reaction.createdAt)
    }

    @Test
    fun `プロパティが正しく設定される`() {
        val board = TestFixtures.board()
        val card = TestFixtures.card(id = "card-1", board = board)
        val participant = TestFixtures.participant(id = "p-1")

        val reaction = Reaction(
            id = "reaction-1",
            card = card,
            board = board,
            participant = participant,
            emoji = "👍",
            createdAt = "2025-01-01T00:00:00Z"
        )

        assertEquals("reaction-1", reaction.id)
        assertEquals("card-1", reaction.card?.id)
        assertEquals(board.id, reaction.board?.id)
        assertEquals("p-1", reaction.participant?.id)
        assertEquals("👍", reaction.emoji)
        assertEquals("2025-01-01T00:00:00Z", reaction.createdAt)
    }

    @Test
    fun `TestFixtures reaction ヘルパーで生成できる`() {
        val board = TestFixtures.board()
        val card = TestFixtures.card(board = board)
        val participant = TestFixtures.participant(id = "p-1")

        val reaction = TestFixtures.reaction(
            card = card,
            board = board,
            participant = participant,
            emoji = "❤️"
        )

        assertNotNull(reaction.id)
        assertEquals(card.id, reaction.card?.id)
        assertEquals("p-1", reaction.participant?.id)
        assertEquals("❤️", reaction.emoji)
    }
}
