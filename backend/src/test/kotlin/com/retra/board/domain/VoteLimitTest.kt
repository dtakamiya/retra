package com.retra.board.domain

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class VoteLimitTest {

    @Test
    fun `isExceeded は上限到達で true`() {
        val limit = VoteLimit(5)
        assertTrue(limit.isExceeded(5))
        assertTrue(limit.isExceeded(6))
    }

    @Test
    fun `isExceeded は上限未満で false`() {
        val limit = VoteLimit(5)
        assertFalse(limit.isExceeded(4))
        assertFalse(limit.isExceeded(0))
    }

    @Test
    fun `remaining は正しい残り投票数を返す`() {
        val limit = VoteLimit(5)
        assertEquals(3, limit.remaining(2))
        assertEquals(0, limit.remaining(5))
        assertEquals(0, limit.remaining(7))
    }

    @Test
    fun `0以下の max で例外`() {
        assertFailsWith<IllegalArgumentException> {
            VoteLimit(0)
        }
    }
}
