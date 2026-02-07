package com.retra.exception

import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import kotlin.test.assertEquals

class GlobalExceptionHandlerTest {

    private val handler = GlobalExceptionHandler()

    @Test
    fun `NotFoundException は 404 を返す`() {
        val response = handler.handleNotFound(NotFoundException("Board not found"))
        assertEquals(HttpStatus.NOT_FOUND, response.statusCode)
        assertEquals(404, response.body?.status)
        assertEquals("Board not found", response.body?.message)
    }

    @Test
    fun `BadRequestException は 400 を返す`() {
        val response = handler.handleBadRequest(BadRequestException("Invalid request"))
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals(400, response.body?.status)
        assertEquals("Invalid request", response.body?.message)
    }

    @Test
    fun `ForbiddenException は 403 を返す`() {
        val response = handler.handleForbidden(ForbiddenException("Access denied"))
        assertEquals(HttpStatus.FORBIDDEN, response.statusCode)
        assertEquals(403, response.body?.status)
        assertEquals("Access denied", response.body?.message)
    }

    @Test
    fun `ConflictException は 409 を返す`() {
        val response = handler.handleConflict(ConflictException("Already exists"))
        assertEquals(HttpStatus.CONFLICT, response.statusCode)
        assertEquals(409, response.body?.status)
        assertEquals("Already exists", response.body?.message)
    }
}
