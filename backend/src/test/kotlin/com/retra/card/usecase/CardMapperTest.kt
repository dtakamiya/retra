package com.retra.card.usecase

import com.retra.TestFixtures
import com.retra.card.domain.Memo
import com.retra.card.domain.Reaction
import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertNull

class CardMapperTest {

    @Test
    fun `匿名モード無効の場合はauthorNicknameが表示される`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        val card = TestFixtures.card(board = board, column = column, participant = participant, authorNickname = "Alice")

        val response = CardMapper.toCardResponse(card, isAnonymous = false, requesterId = "p-2")

        assertEquals("Alice", response.authorNickname)
    }

    @Test
    fun `匿名モード有効で自分のカードの場合はauthorNicknameが表示される`() {
        val board = TestFixtures.board(isAnonymous = true)
        val column = TestFixtures.boardColumn(board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        val card = TestFixtures.card(board = board, column = column, participant = participant, authorNickname = "Alice")

        val response = CardMapper.toCardResponse(card, isAnonymous = true, requesterId = "p-1")

        assertEquals("Alice", response.authorNickname)
    }

    @Test
    fun `匿名モード有効で他人のカードの場合はauthorNicknameがnullになる`() {
        val board = TestFixtures.board(isAnonymous = true)
        val column = TestFixtures.boardColumn(board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        val card = TestFixtures.card(board = board, column = column, participant = participant, authorNickname = "Alice")

        val response = CardMapper.toCardResponse(card, isAnonymous = true, requesterId = "p-2")

        assertNull(response.authorNickname)
    }

    @Test
    fun `匿名モード有効でrequesterIdがnullの場合はauthorNicknameがnullになる`() {
        val board = TestFixtures.board(isAnonymous = true)
        val column = TestFixtures.boardColumn(board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        val card = TestFixtures.card(board = board, column = column, participant = participant, authorNickname = "Alice")

        val response = CardMapper.toCardResponse(card, isAnonymous = true, requesterId = null)

        assertNull(response.authorNickname)
    }

    @Test
    fun `toCardResponse でデフォルトパラメータ（isAnonymous=false, requesterId=null）`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val participant = TestFixtures.participant(id = "p-1", board = board, nickname = "Alice")
        val card = TestFixtures.card(board = board, column = column, participant = participant, authorNickname = "Alice")

        val response = CardMapper.toCardResponse(card)

        assertEquals("Alice", response.authorNickname)
    }

    @Test
    fun `toCardResponse でcolumnがnullの場合はcolumnIdが空文字になる`() {
        val card = TestFixtures.card(column = null, participant = null)

        val response = CardMapper.toCardResponse(card)

        assertEquals("", response.columnId)
        assertNull(response.participantId)
    }

    @Test
    fun `toCardResponse で投票情報が正しくマッピングされる`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(board = board, column = column)
        val voter1 = TestFixtures.participant(id = "v-1")
        val voter2 = TestFixtures.participant(id = "v-2")
        card.addVote(voter1)
        card.addVote(voter2)

        val response = CardMapper.toCardResponse(card)

        assertEquals(2, response.voteCount)
        assertEquals(listOf("v-1", "v-2"), response.votedParticipantIds.sorted())
    }

    @Test
    fun `toCardResponse でメモとリアクションがマッピングされる`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val participant = TestFixtures.participant(id = "p-1")
        val card = TestFixtures.card(board = board, column = column, participant = participant)
        val now = Instant.now().toString()
        card.memos.add(Memo(id = "m-1", card = card, board = board, content = "memo", participant = participant, createdAt = now, updatedAt = now))
        card.reactions.add(Reaction(id = "r-1", card = card, board = board, participant = participant, emoji = "👍", createdAt = now))

        val response = CardMapper.toCardResponse(card)

        assertEquals(1, response.memos.size)
        assertEquals("m-1", response.memos[0].id)
        assertEquals(1, response.reactions.size)
        assertEquals("r-1", response.reactions[0].id)
    }

    @Test
    fun `toCardResponse でisDiscussedとdiscussionOrderがマッピングされる`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(board = board, column = column)
        card.isDiscussed = true
        card.discussionOrder = 3

        val response = CardMapper.toCardResponse(card)

        assertEquals(true, response.isDiscussed)
        assertEquals(3, response.discussionOrder)
    }

}
