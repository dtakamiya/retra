package com.retra.shared.domain

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class ErrorCodeTest {

    @Test
    fun `全てのErrorCodeがユニークなコード文字列を持つ`() {
        val codes = ErrorCode.entries.map { it.code }
        assertEquals(codes.size, codes.toSet().size, "ErrorCodeに重複するコードがあります")
    }

    @Test
    fun `ErrorCode列挙型が空白でないコードを持つ`() {
        ErrorCode.entries.forEach { errorCode ->
            assertNotNull(errorCode.code)
            assert(errorCode.code.isNotBlank()) { "ErrorCode ${errorCode.name} のコードが空白です" }
        }
    }

    @Test
    fun `DomainExceptionにErrorCodeを設定できる`() {
        val ex = NotFoundException("not found", ErrorCode.BOARD_NOT_FOUND)
        assertEquals(ErrorCode.BOARD_NOT_FOUND, ex.errorCode)
        assertEquals("not found", ex.message)
    }

    @Test
    fun `DomainExceptionのデフォルトErrorCodeが使用される`() {
        val notFound = NotFoundException("not found")
        assertEquals(ErrorCode.RESOURCE_NOT_FOUND, notFound.errorCode)

        val badRequest = BadRequestException("bad")
        assertEquals(ErrorCode.BAD_REQUEST, badRequest.errorCode)

        val forbidden = ForbiddenException("no access")
        assertEquals(ErrorCode.FORBIDDEN, forbidden.errorCode)

        val conflict = ConflictException("conflict")
        assertEquals(ErrorCode.CONFLICT, conflict.errorCode)

        val phaseTransition = InvalidPhaseTransitionException("invalid")
        assertEquals(ErrorCode.INVALID_PHASE_TRANSITION, phaseTransition.errorCode)
    }
}
