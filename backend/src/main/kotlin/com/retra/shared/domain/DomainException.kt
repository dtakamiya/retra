package com.retra.shared.domain

sealed class DomainException(message: String) : RuntimeException(message)

class NotFoundException(message: String) : DomainException(message)
class BadRequestException(message: String) : DomainException(message)
class ForbiddenException(message: String) : DomainException(message)
class ConflictException(message: String) : DomainException(message)
class InvalidPhaseTransitionException(message: String) : DomainException(message)
