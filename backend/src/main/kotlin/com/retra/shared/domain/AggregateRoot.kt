package com.retra.shared.domain

import jakarta.persistence.MappedSuperclass
import jakarta.persistence.Transient

@MappedSuperclass
abstract class AggregateRoot {
    @Transient
    private val _domainEvents: MutableList<DomainEvent> = mutableListOf()

    fun getDomainEvents(): List<DomainEvent> = _domainEvents.toList()

    fun clearDomainEvents() {
        _domainEvents.clear()
    }

    protected fun registerEvent(event: DomainEvent) {
        _domainEvents.add(event)
    }
}
