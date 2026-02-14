package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.card.domain.Memo
import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertNull

class MemoMapperTest {

    @Test
    fun `toMemoResponse で正常にマッピングされる`() {
        val card = TestFixtures.card(id = "card-1")
        val participant = TestFixtures.participant(id = "p-1", nickname = "Alice")
        val now = Instant.now().toString()
        val memo = Memo(
            id = "memo-1",
            card = card,
            board = TestFixtures.board(),
            content = "Test memo",
            authorNickname = "Alice",
            participant = participant,
            createdAt = now,
            updatedAt = now
        )

        val response = MemoMapper.toMemoResponse(memo)

        assertEquals("memo-1", response.id)
        assertEquals("card-1", response.cardId)
        assertEquals("Test memo", response.content)
        assertEquals("Alice", response.authorNickname)
        assertEquals("p-1", response.participantId)
        assertEquals(now, response.createdAt)
        assertEquals(now, response.updatedAt)
    }

    @Test
    fun `toMemoResponse でcardがnullの場合はcardIdが空文字`() {
        val now = Instant.now().toString()
        val memo = Memo(
            id = "memo-1",
            card = null,
            board = TestFixtures.board(),
            content = "Test",
            participant = null,
            createdAt = now,
            updatedAt = now
        )

        val response = MemoMapper.toMemoResponse(memo)

        assertEquals("", response.cardId)
        assertNull(response.participantId)
    }

    @Test
    fun `toMemoResponse でauthorNicknameがnullの場合`() {
        val now = Instant.now().toString()
        val memo = Memo(
            id = "memo-1",
            card = TestFixtures.card(id = "card-1"),
            board = TestFixtures.board(),
            content = "Test",
            authorNickname = null,
            participant = TestFixtures.participant(id = "p-1"),
            createdAt = now,
            updatedAt = now
        )

        val response = MemoMapper.toMemoResponse(memo)

        assertNull(response.authorNickname)
    }
}
