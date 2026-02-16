package com.retra.kudos.domain

import com.retra.TestFixtures
import com.retra.shared.domain.BadRequestException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class KudosTest {

    @Test
    fun `Kudos作成に成功する`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1")

        val kudos = Kudos.create(board, sender, receiver, KudosCategory.GREAT_JOB, "素晴らしい仕事でした！")

        assertNotNull(kudos.id)
        assertEquals(board, kudos.board)
        assertEquals(sender, kudos.sender)
        assertEquals(receiver, kudos.receiver)
        assertEquals(KudosCategory.GREAT_JOB, kudos.category)
        assertEquals("素晴らしい仕事でした！", kudos.message)
        assertNotNull(kudos.createdAt)
    }

    @Test
    fun `メッセージなしでKudos作成に成功する`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1")

        val kudos = Kudos.create(board, sender, receiver, KudosCategory.THANK_YOU, null)

        assertNull(kudos.message)
    }

    @Test
    fun `空文字メッセージはnullに変換される`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1")

        val kudos = Kudos.create(board, sender, receiver, KudosCategory.HELPFUL, "  ")

        assertNull(kudos.message)
    }

    @Test
    fun `自分自身にKudosを送れない`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(id = "same-id")

        assertThrows<BadRequestException> {
            Kudos.create(board, participant, participant, KudosCategory.GREAT_JOB, null)
        }
    }

    @Test
    fun `140文字を超えるメッセージは拒否される`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1")
        val longMessage = "a".repeat(141)

        assertThrows<BadRequestException> {
            Kudos.create(board, sender, receiver, KudosCategory.GREAT_JOB, longMessage)
        }
    }
}
