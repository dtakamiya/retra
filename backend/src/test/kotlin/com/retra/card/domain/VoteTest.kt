package com.retra.card.domain

import com.retra.TestFixtures
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class VoteTest {

    @Test
    fun `デフォルトコンストラクタでIDが生成される`() {
        val vote = Vote()
        assertNotNull(vote.id)
        assertNull(vote.card)
        assertNull(vote.participant)
        assertNotNull(vote.createdAt)
    }

    @Test
    fun `プロパティが正しく設定される`() {
        val card = TestFixtures.card(id = "card-1")
        val participant = TestFixtures.participant(id = "p-1", nickname = "Alice")

        val vote = Vote(
            id = "vote-1",
            card = card,
            participant = participant,
            createdAt = "2025-01-01T00:00:00Z"
        )

        assertEquals("vote-1", vote.id)
        assertEquals("card-1", vote.card?.id)
        assertEquals("p-1", vote.participant?.id)
        assertEquals("2025-01-01T00:00:00Z", vote.createdAt)
    }

    @Test
    fun `TestFixtures vote ヘルパーで生成できる`() {
        val card = TestFixtures.card(id = "card-1")
        val participant = TestFixtures.participant(id = "p-1")

        val vote = TestFixtures.vote(card = card, participant = participant)

        assertNotNull(vote.id)
        assertEquals("card-1", vote.card?.id)
        assertEquals("p-1", vote.participant?.id)
    }
}
