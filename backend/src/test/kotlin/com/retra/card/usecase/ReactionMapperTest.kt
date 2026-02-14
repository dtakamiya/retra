package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.card.domain.Reaction
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class ReactionMapperTest {

    @Test
    fun `toReactionResponse で正常にマッピングされる`() {
        val card = TestFixtures.card(id = "card-1")
        val participant = TestFixtures.participant(id = "p-1")
        val reaction = Reaction(
            id = "r-1",
            card = card,
            board = TestFixtures.board(),
            participant = participant,
            emoji = "👍",
            createdAt = "2025-01-01T00:00:00Z"
        )

        val response = ReactionMapper.toReactionResponse(reaction)

        assertEquals("r-1", response.id)
        assertEquals("card-1", response.cardId)
        assertEquals("p-1", response.participantId)
        assertEquals("👍", response.emoji)
        assertEquals("2025-01-01T00:00:00Z", response.createdAt)
    }

    @Test
    fun `toReactionResponse でcardがnullの場合はcardIdが空文字`() {
        val reaction = Reaction(
            id = "r-1",
            card = null,
            board = TestFixtures.board(),
            participant = null,
            emoji = "❤️",
            createdAt = "2025-01-01T00:00:00Z"
        )

        val response = ReactionMapper.toReactionResponse(reaction)

        assertEquals("", response.cardId)
        assertEquals("", response.participantId)
    }
}
