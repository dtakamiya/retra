package com.retra.board.domain

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class BoardSlugTest {

    @Test
    fun `generate は8文字のslugを生成`() {
        val slug = BoardSlug.generate()
        assertEquals(8, slug.value.length)
    }

    @Test
    fun `有効なslugでインスタンス化`() {
        val slug = BoardSlug("abcd2345")
        assertEquals("abcd2345", slug.value)
    }

    @Test
    fun `8文字未満の場合例外`() {
        assertFailsWith<IllegalArgumentException> {
            BoardSlug("abc")
        }
    }
}
