package com.retra.shared.gateway.exception

import com.retra.shared.domain.*
import org.junit.jupiter.api.Test
import org.springframework.core.MethodParameter
import org.springframework.http.HttpStatus
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.validation.BindingResult
import org.springframework.validation.FieldError
import org.springframework.validation.MapBindingResult
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

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
        val errorResponse = ErrorResponse(
            status = 500,
            error = "Internal",
            message = "Something went wrong",
            errorCode = "INTERNAL_ERROR",
            errorId = "test-uuid"
        )
        assertEquals(500, errorResponse.status)
        assertEquals("Internal", errorResponse.error)
        assertEquals("Something went wrong", errorResponse.message)
        assertEquals("INTERNAL_ERROR", errorResponse.errorCode)
        assertEquals("test-uuid", errorResponse.errorId)
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

    // --- ErrorCode テスト ---

    @Test
    fun `NotFoundException のレスポンスにデフォルトerrorCodeが含まれる`() {
        val response = handler.handleNotFound(NotFoundException("not found"))
        assertEquals("RESOURCE_NOT_FOUND", response.body?.errorCode)
    }

    @Test
    fun `NotFoundException にカスタムerrorCodeを設定できる`() {
        val response = handler.handleNotFound(NotFoundException("not found", ErrorCode.BOARD_NOT_FOUND))
        assertEquals("BOARD_NOT_FOUND", response.body?.errorCode)
    }

    @Test
    fun `BadRequestException のレスポンスにデフォルトerrorCodeが含まれる`() {
        val response = handler.handleBadRequest(BadRequestException("bad"))
        assertEquals("BAD_REQUEST", response.body?.errorCode)
    }

    @Test
    fun `BadRequestException にカスタムerrorCodeを設定できる`() {
        val response = handler.handleBadRequest(BadRequestException("limit", ErrorCode.VOTE_LIMIT_REACHED))
        assertEquals("VOTE_LIMIT_REACHED", response.body?.errorCode)
    }

    @Test
    fun `ForbiddenException のレスポンスにデフォルトerrorCodeが含まれる`() {
        val response = handler.handleForbidden(ForbiddenException("no"))
        assertEquals("FORBIDDEN", response.body?.errorCode)
    }

    @Test
    fun `ForbiddenException にカスタムerrorCodeを設定できる`() {
        val response = handler.handleForbidden(ForbiddenException("no", ErrorCode.NOT_FACILITATOR))
        assertEquals("NOT_FACILITATOR", response.body?.errorCode)
    }

    @Test
    fun `ConflictException のレスポンスにデフォルトerrorCodeが含まれる`() {
        val response = handler.handleConflict(ConflictException("dup"))
        assertEquals("CONFLICT", response.body?.errorCode)
    }

    @Test
    fun `ConflictException にカスタムerrorCodeを設定できる`() {
        val response = handler.handleConflict(ConflictException("dup", ErrorCode.DUPLICATE_VOTE))
        assertEquals("DUPLICATE_VOTE", response.body?.errorCode)
    }

    @Test
    fun `InvalidPhaseTransitionException のレスポンスにerrorCodeが含まれる`() {
        val response = handler.handleInvalidPhaseTransition(InvalidPhaseTransitionException("invalid"))
        assertEquals("INVALID_PHASE_TRANSITION", response.body?.errorCode)
    }

    // --- ErrorId テスト ---

    @Test
    fun `未知の例外のレスポンスにerrorIdが含まれる`() {
        val response = handler.handleGenericException(RuntimeException("unexpected"))
        assertNotNull(response.body?.errorId)
        assertTrue(response.body!!.errorId!!.isNotBlank())
    }

    @Test
    fun `未知の例外のerrorCodeはINTERNAL_ERROR`() {
        val response = handler.handleGenericException(RuntimeException("unexpected"))
        assertEquals("INTERNAL_ERROR", response.body?.errorCode)
    }

    @Test
    fun `ドメイン例外のレスポンスにもerrorIdが含まれない（nullである）`() {
        val response = handler.handleNotFound(NotFoundException("not found"))
        // ドメイン例外は想定済みのエラーなのでerrorIdは不要
        assertEquals(null, response.body?.errorId)
    }

    @Suppress("unused")
    fun dummyMethod(param: String) {}

    @Test
    fun `MethodArgumentNotValidException は 400`() {
        val bindingResult: BindingResult = MapBindingResult(mutableMapOf<String, Any>(), "request")
        bindingResult.addError(FieldError("request", "content", "must not be blank"))
        val method = this::class.java.getDeclaredMethod("dummyMethod", String::class.java)
        val ex = MethodArgumentNotValidException(
            MethodParameter(method, 0),
            bindingResult
        )
        val response = handler.handleValidation(ex)
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals(400, response.body?.status)
        assertEquals("Validation Error", response.body?.error)
        assertEquals("content: must not be blank", response.body?.message)
        assertEquals("VALIDATION_ERROR", response.body?.errorCode)
    }

    @Test
    fun `MethodArgumentNotValidException でフィールドエラーが空の場合は空メッセージ`() {
        val bindingResult: BindingResult = MapBindingResult(mutableMapOf<String, Any>(), "request")
        val method = this::class.java.getDeclaredMethod("dummyMethod", String::class.java)
        val ex = MethodArgumentNotValidException(
            MethodParameter(method, 0),
            bindingResult
        )
        val response = handler.handleValidation(ex)
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals("", response.body?.message)
    }

    @Test
    fun `MethodArgumentNotValidException で複数フィールドエラーがカンマ区切りで結合される`() {
        val bindingResult: BindingResult = MapBindingResult(mutableMapOf<String, Any>(), "request")
        bindingResult.addError(FieldError("request", "title", "must not be blank"))
        bindingResult.addError(FieldError("request", "content", "size must be between 1 and 2000"))
        val method = this::class.java.getDeclaredMethod("dummyMethod", String::class.java)
        val ex = MethodArgumentNotValidException(
            MethodParameter(method, 0),
            bindingResult
        )
        val response = handler.handleValidation(ex)
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals("title: must not be blank, content: size must be between 1 and 2000", response.body?.message)
    }

    @Test
    fun `HttpMessageNotReadableException は 400`() {
        val response = handler.handleBadJson(
            HttpMessageNotReadableException("bad json")
        )
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals(400, response.body?.status)
        assertEquals("Invalid request body", response.body?.message)
        assertEquals("INVALID_REQUEST_BODY", response.body?.errorCode)
    }

    @Test
    fun `IllegalArgumentException は 400`() {
        val response = handler.handleIllegalArgument(IllegalArgumentException("invalid arg"))
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals(400, response.body?.status)
        assertEquals("invalid arg", response.body?.message)
        assertEquals("INVALID_ARGUMENT", response.body?.errorCode)
    }

    @Test
    fun `HttpRequestMethodNotSupportedException は 405`() {
        val response = handler.handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException("DELETE")
        )
        assertEquals(HttpStatus.METHOD_NOT_ALLOWED, response.statusCode)
        assertEquals(405, response.body?.status)
        assertEquals("METHOD_NOT_ALLOWED", response.body?.errorCode)
    }

    @Test
    fun `MissingServletRequestParameterException は errorCode MISSING_PARAMETER を持つ`() {
        val ex = org.springframework.web.bind.MissingServletRequestParameterException("participantId", "String")
        val response = handler.handleMissingParam(ex)
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals("MISSING_PARAMETER", response.body?.errorCode)
    }

    @Test
    fun `未知の例外は 500`() {
        val response = handler.handleGenericException(RuntimeException("unexpected"))
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.statusCode)
        assertEquals(500, response.body?.status)
        assertEquals("An unexpected error occurred", response.body?.message)
    }
}
