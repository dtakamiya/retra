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

    @Test
    fun `ErrorResponse のプロパティが正しく設定される`() {
        val errorResponse = ErrorResponse(status = 500, error = "Internal", message = "Something went wrong")
        assertEquals(500, errorResponse.status)
        assertEquals("Internal", errorResponse.error)
        assertEquals("Something went wrong", errorResponse.message)
    }

    @Test
    fun `NotFoundException のレスポンスにerrorフィールドが含まれる`() {
        val response = handler.handleNotFound(NotFoundException("test"))
        assertEquals("Not Found", response.body?.error)
    }

    @Test
    fun `BadRequestException のレスポンスにerrorフィールドが含まれる`() {
        val response = handler.handleBadRequest(BadRequestException("test"))
        assertEquals("Bad Request", response.body?.error)
    }

    @Test
    fun `ForbiddenException のレスポンスにerrorフィールドが含まれる`() {
        val response = handler.handleForbidden(ForbiddenException("test"))
        assertEquals("Forbidden", response.body?.error)
    }

    @Test
    fun `ConflictException のレスポンスにerrorフィールドが含まれる`() {
        val response = handler.handleConflict(ConflictException("test"))
        assertEquals("Conflict", response.body?.error)
    }

    @Test
    fun `InvalidPhaseTransitionException のレスポンスにerrorフィールドが含まれる`() {
        val response = handler.handleInvalidPhaseTransition(InvalidPhaseTransitionException("test"))
        assertEquals("Bad Request", response.body?.error)
        assertEquals("test", response.body?.message)
    }
}
