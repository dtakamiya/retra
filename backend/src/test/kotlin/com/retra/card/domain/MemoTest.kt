package com.retra.card.domain

import com.retra.TestFixtures
import com.retra.shared.domain.ForbiddenException
import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class MemoTest {

    @Test
    fun `create でメモ生成とドメインイベント`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(board = board, column = column)
        val author = TestFixtures.participant(id = "p-1", nickname = "Alice")

        val memo = Memo.create(card, board, "Test memo", author)

        assertEquals("Test memo", memo.content)
        assertEquals("Alice", memo.authorNickname)
        assertTrue(memo.getDomainEvents().isNotEmpty())
        assertTrue(memo.getDomainEvents().first() is MemoEvent.MemoCreated)
    }

    @Test
    fun `updateContent で著者がコンテンツ更新`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(board = board, column = column)
        val participant = TestFixtures.participant(id = "p-1")
        val memo = Memo(
            id = "memo-1",
            card = card,
            board = board,
            content = "Original",
            authorNickname = "Alice",
            participant = participant,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        memo.updateContent("Updated", "p-1")

        assertEquals("Updated", memo.content)
        assertTrue(memo.getDomainEvents().isNotEmpty())
        assertTrue(memo.getDomainEvents().first() is MemoEvent.MemoUpdated)
    }

    @Test
    fun `updateContent で非著者は ForbiddenException`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(board = board, column = column)
        val participant = TestFixtures.participant(id = "p-1")
        val memo = Memo(
            id = "memo-1",
            card = card,
            board = board,
            content = "Original",
            authorNickname = "Alice",
            participant = participant,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertFailsWith<ForbiddenException> {
            memo.updateContent("Updated", "p-2")
        }
    }

    @Test
    fun `canBeDeletedBy で著者は true`() {
        val author = TestFixtures.participant(id = "p-1")
        val memo = Memo(
            id = "memo-1",
            card = TestFixtures.card(),
            board = TestFixtures.board(),
            content = "Test",
            authorNickname = "Alice",
            participant = author,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertTrue(memo.canBeDeletedBy(author))
    }

    @Test
    fun `canBeDeletedBy でファシリテーターは true`() {
        val author = TestFixtures.participant(id = "p-1")
        val facilitator = TestFixtures.participant(id = "p-2", isFacilitator = true)
        val memo = Memo(
            id = "memo-1",
            card = TestFixtures.card(),
            board = TestFixtures.board(),
            content = "Test",
            authorNickname = "Alice",
            participant = author,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertTrue(memo.canBeDeletedBy(facilitator))
    }

    @Test
    fun `canBeDeletedBy で非著者・非ファシリテーターは false`() {
        val author = TestFixtures.participant(id = "p-1")
        val other = TestFixtures.participant(id = "p-3", isFacilitator = false)
        val memo = Memo(
            id = "memo-1",
            card = TestFixtures.card(),
            board = TestFixtures.board(),
            content = "Test",
            authorNickname = "Alice",
            participant = author,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertFalse(memo.canBeDeletedBy(other))
    }

    @Test
    fun `clearDomainEvents でイベントがクリアされる`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(board = board, column = column)
        val author = TestFixtures.participant(id = "p-1", nickname = "Alice")

        val memo = Memo.create(card, board, "Test memo", author)
        assertTrue(memo.getDomainEvents().isNotEmpty())

        memo.clearDomainEvents()
        assertTrue(memo.getDomainEvents().isEmpty())
    }

    @Test
    fun `デフォルトコンストラクタでプロパティが初期化される`() {
        val memo = Memo()
        assertNotNull(memo.id)
        assertEquals("", memo.content)
        assertNull(memo.authorNickname)
        assertNull(memo.participant)
        assertNotNull(memo.createdAt)
        assertNotNull(memo.updatedAt)
    }

    @Test
    fun `updateContent でboardやcardがnullでもイベントが生成される`() {
        val participant = TestFixtures.participant(id = "p-1")
        val memo = Memo(
            id = "memo-1",
            card = null,
            board = null,
            content = "Original",
            authorNickname = "Alice",
            participant = participant,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        memo.updateContent("Updated", "p-1")

        assertEquals("Updated", memo.content)
        val event = memo.getDomainEvents().first() as MemoEvent.MemoUpdated
        assertEquals("", event.slug)
        assertEquals("", event.cardId)
    }

    @Test
    fun `canBeDeletedBy でparticipantがnullの場合は false`() {
        val other = TestFixtures.participant(id = "p-3")
        val memo = Memo(
            id = "memo-1",
            card = TestFixtures.card(),
            board = TestFixtures.board(),
            content = "Test",
            authorNickname = null,
            participant = null,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertFalse(memo.canBeDeletedBy(other))
    }

    @Test
    fun `updateContent でparticipantがnullの場合は ForbiddenException`() {
        val memo = Memo(
            id = "memo-1",
            card = TestFixtures.card(),
            board = TestFixtures.board(),
            content = "Original",
            authorNickname = null,
            participant = null,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertFailsWith<ForbiddenException> {
            memo.updateContent("Updated", "p-1")
        }
    }
}
