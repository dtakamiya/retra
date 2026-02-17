package com.retra.shared.domain

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals

class EnumParserTest {

    private enum class TestEnum {
        VALUE_ONE, VALUE_TWO, VALUE_THREE
    }

    @Test
    fun `正確な値で解析できる`() {
        val result = EnumParser.parse<TestEnum>("VALUE_ONE", "test")
        assertEquals(TestEnum.VALUE_ONE, result)
    }

    @Test
    fun `小文字の値で解析できる`() {
        val result = EnumParser.parse<TestEnum>("value_two", "test")
        assertEquals(TestEnum.VALUE_TWO, result)
    }

    @Test
    fun `大文字小文字混在の値で解析できる`() {
        val result = EnumParser.parse<TestEnum>("Value_Three", "test")
        assertEquals(TestEnum.VALUE_THREE, result)
    }

    @Test
    fun `無効な値でBadRequestExceptionをスローする`() {
        val exception = assertThrows<BadRequestException> {
            EnumParser.parse<TestEnum>("INVALID", "test")
        }
        assertEquals(
            "Invalid test: INVALID. Valid values: VALUE_ONE, VALUE_TWO, VALUE_THREE",
            exception.message
        )
    }

    @Test
    fun `空文字でBadRequestExceptionをスローする`() {
        val exception = assertThrows<BadRequestException> {
            EnumParser.parse<TestEnum>("", "test field")
        }
        assertEquals(
            "Invalid test field: . Valid values: VALUE_ONE, VALUE_TWO, VALUE_THREE",
            exception.message
        )
    }

    @Test
    fun `エラーメッセージにラベルが含まれる`() {
        val exception = assertThrows<BadRequestException> {
            EnumParser.parse<TestEnum>("bad", "priority")
        }
        assertEquals(
            "Invalid priority: bad. Valid values: VALUE_ONE, VALUE_TWO, VALUE_THREE",
            exception.message
        )
    }
}
