package com.retra.shared.domain

sealed class DomainException(
    message: String,
    val errorCode: ErrorCode
) : RuntimeException(message)

class NotFoundException(
    message: String,
    errorCode: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND
) : DomainException(message, errorCode)

class BadRequestException(
    message: String,
    errorCode: ErrorCode = ErrorCode.BAD_REQUEST
) : DomainException(message, errorCode)

class ForbiddenException(
    message: String,
    errorCode: ErrorCode = ErrorCode.FORBIDDEN
) : DomainException(message, errorCode)

class ConflictException(
    message: String,
    errorCode: ErrorCode = ErrorCode.CONFLICT
) : DomainException(message, errorCode)

class InvalidPhaseTransitionException(
    message: String,
    errorCode: ErrorCode = ErrorCode.INVALID_PHASE_TRANSITION
) : DomainException(message, errorCode)
