package com.retra.shared.gateway.exception

import com.retra.shared.domain.*
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import kotlin.test.assertEquals

class GlobalExceptionHandlerTest {

    private val handler = GlobalExceptionHandler()

    @Test
    fun `NotFoundException は 404`() {
        val response = handler.handleNotFound(NotFoundException("not found"))
        assertEquals(HttpStatus.NOT_FOUND, response.statusCode)
        assertEquals(404, response.body?.status)
        assertEquals("not found", response.body?.message)
    }

    @Test
    fun `BadRequestException は 400`() {
        val response = handler.handleBadRequest(BadRequestException("bad request"))
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals(400, response.body?.status)
    }

    @Test
    fun `ForbiddenException は 403`() {
        val response = handler.handleForbidden(ForbiddenException("forbidden"))
        assertEquals(HttpStatus.FORBIDDEN, response.statusCode)
        assertEquals(403, response.body?.status)
    }

    @Test
    fun `ConflictException は 409`() {
        val response = handler.handleConflict(ConflictException("conflict"))
        assertEquals(HttpStatus.CONFLICT, response.statusCode)
        assertEquals(409, response.body?.status)
    }

    @Test
    fun `InvalidPhaseTransitionException は 400`() {
        val response = handler.handleInvalidPhaseTransition(InvalidPhaseTransitionException("invalid transition"))
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals(400, response.body?.status)
    }
}
