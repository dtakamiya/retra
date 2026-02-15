package com.retra.card.domain

import com.retra.TestFixtures
import com.retra.shared.domain.ConflictException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class CardTest {

    @Test
    fun `create でカード生成とドメインイベント`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val author = TestFixtures.participant(id = "p-1", nickname = "Alice")

        val card = Card.create(board, column, "Test content", author, 0)

        assertEquals("Test content", card.content)
        assertEquals("Alice", card.authorNickname)
        assertTrue(card.getDomainEvents().isNotEmpty())
    }

    @Test
    fun `updateContent で著者がコンテンツ更新`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val participant = TestFixtures.participant(id = "p-1")
        val card = TestFixtures.card(board = board, column = column, participant = participant)

        card.updateContent("Updated", "p-1")

        assertEquals("Updated", card.content)
        assertTrue(card.getDomainEvents().isNotEmpty())
    }

    @Test
    fun `updateContent で非著者は ForbiddenException`() {
        val participant = TestFixtures.participant(id = "p-1")
        val card = TestFixtures.card(participant = participant)

        assertFailsWith<ForbiddenException> {
            card.updateContent("Updated", "p-2")
        }
    }

    @Test
    fun `addVote で投票追加`() {
        val voter = TestFixtures.participant(id = "p-1")
        val card = TestFixtures.card()

        val vote = card.addVote(voter)

        assertEquals(1, card.votes.size)
        assertEquals(voter.id, vote.participant?.id)
    }

    @Test
    fun `addVote で重複投票は ConflictException`() {
        val voter = TestFixtures.participant(id = "p-1")
        val card = TestFixtures.card()
        card.addVote(voter)

        assertFailsWith<ConflictException> {
            card.addVote(voter)
        }
    }

    @Test
    fun `removeVote で投票削除`() {
        val voter = TestFixtures.participant(id = "p-1")
        val card = TestFixtures.card()
        card.addVote(voter)

        card.removeVote("p-1")

        assertEquals(0, card.votes.size)
    }

    @Test
    fun `removeVote で存在しない投票は NotFoundException`() {
        val card = TestFixtures.card()
        assertFailsWith<NotFoundException> {
            card.removeVote("p-1")
        }
    }

    @Test
    fun `moveTo でカラム移動とドメインイベント`() {
        val board = TestFixtures.board()
        val col1 = TestFixtures.boardColumn(id = "col-1", board = board)
        val col2 = TestFixtures.boardColumn(id = "col-2", board = board)
        val card = TestFixtures.card(column = col1, board = board)

        card.moveTo(col2, 0)

        assertEquals("col-2", card.column?.id)
        assertEquals(0, card.sortOrder)
        assertTrue(card.getDomainEvents().isNotEmpty())
    }

    @Test
    fun `clearDomainEvents でイベントがクリアされる`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val author = TestFixtures.participant(id = "p-1")
        val card = Card.create(board, column, "content", author, 0)

        assertTrue(card.getDomainEvents().isNotEmpty())
        card.clearDomainEvents()
        assertTrue(card.getDomainEvents().isEmpty())
    }

    @Test
    fun `updateContent でboardがnullの場合はIllegalStateExceptionが発生する`() {
        val participant = TestFixtures.participant(id = "p-1")
        val card = TestFixtures.card(
            board = null,
            column = null,
            participant = participant
        )

        assertFailsWith<IllegalStateException> {
            card.updateContent("Updated", "p-1")
        }
    }

    @Test
    fun `moveTo でcolumnがnullでもイベントのsourceColumnIdが空文字`() {
        val board = TestFixtures.board()
        val col2 = TestFixtures.boardColumn(id = "col-2")
        val card = TestFixtures.card(board = board, column = null)

        card.moveTo(col2, 1)

        val event = card.getDomainEvents().first() as CardEvent.CardMoved
        assertEquals("", event.sourceColumnId)
        assertEquals("col-2", event.targetColumnId)
    }

    @Test
    fun `markAsDiscussed でboardがnullの場合はIllegalStateException`() {
        val card = TestFixtures.card(board = null)

        assertFailsWith<IllegalStateException> {
            card.markAsDiscussed()
        }
    }

    @Test
    fun `unmarkAsDiscussed でboardがnullの場合はIllegalStateException`() {
        val card = TestFixtures.card(board = null)

        assertFailsWith<IllegalStateException> {
            card.unmarkAsDiscussed()
        }
    }

    @Test
    fun `デフォルトコンストラクタでプロパティが初期化される`() {
        val card = Card()
        assertNotNull(card.id)
        assertEquals("", card.content)
        assertEquals(0, card.sortOrder)
        assertEquals(false, card.isDiscussed)
        assertEquals(0, card.discussionOrder)
        assertTrue(card.votes.isEmpty())
        assertTrue(card.memos.isEmpty())
        assertTrue(card.reactions.isEmpty())
    }

    @Test
    fun `create で匿名ボードの場合はisAnonymousがtrueのイベント`() {
        val board = TestFixtures.board(isAnonymous = true)
        val column = TestFixtures.boardColumn(board = board)
        val author = TestFixtures.participant(id = "p-1", nickname = "Alice")

        val card = Card.create(board, column, "content", author, 0)

        val event = card.getDomainEvents().first() as CardEvent.CardCreated
        assertTrue(event.isAnonymous)
    }

    @Test
    fun `updateContent で投票数がイベントに含まれる`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val participant = TestFixtures.participant(id = "p-1")
        val card = TestFixtures.card(board = board, column = column, participant = participant)
        val voter = TestFixtures.participant(id = "v-1")
        card.addVote(voter)

        card.updateContent("Updated", "p-1")

        val event = card.getDomainEvents().first() as CardEvent.CardUpdated
        assertEquals(1, event.voteCount)
    }
}
