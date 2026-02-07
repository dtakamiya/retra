package com.retra.shared.domain

import java.time.Instant

interface DomainEvent {
    val occurredAt: Instant
        get() = Instant.now()
}
