package com.retra.kudos.usecase

import com.retra.TestFixtures
import com.retra.kudos.domain.KudosCategory
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class KudosMapperTest {

    @Test
    fun `null関連を持つKudosをマッピングすると空文字列を返す`() {
        val kudos = TestFixtures.kudos(
            id = "kudos-1",
            board = null,
            sender = null,
            receiver = null,
            category = KudosCategory.GREAT_JOB,
            message = "テストメッセージ",
            createdAt = "2024-01-01T00:00:00Z"
        )

        val response = KudosMapper.toResponse(kudos)

        assertEquals("kudos-1", response.id)
        assertEquals("", response.boardId)
        assertEquals("", response.senderId)
        assertEquals("", response.senderNickname)
        assertEquals("", response.receiverId)
        assertEquals("", response.receiverNickname)
        assertEquals("GREAT_JOB", response.category)
        assertEquals("テストメッセージ", response.message)
        assertEquals("2024-01-01T00:00:00Z", response.createdAt)
    }

    @Test
    fun `全プロパティが設定されたKudosを正しくマッピングする`() {
        val board = TestFixtures.board(id = "board-1")
        val sender = TestFixtures.participant(id = "sender-1", nickname = "Alice")
        val receiver = TestFixtures.participant(id = "receiver-1", nickname = "Bob")
        val kudos = TestFixtures.kudos(
            id = "kudos-2",
            board = board,
            sender = sender,
            receiver = receiver,
            category = KudosCategory.THANK_YOU,
            message = null,
            createdAt = "2024-06-15T12:00:00Z"
        )

        val response = KudosMapper.toResponse(kudos)

        assertEquals("kudos-2", response.id)
        assertEquals("board-1", response.boardId)
        assertEquals("sender-1", response.senderId)
        assertEquals("Alice", response.senderNickname)
        assertEquals("receiver-1", response.receiverId)
        assertEquals("Bob", response.receiverNickname)
        assertEquals("THANK_YOU", response.category)
        assertEquals(null, response.message)
        assertEquals("2024-06-15T12:00:00Z", response.createdAt)
    }
}
