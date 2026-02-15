package com.retra.shared.domain

import java.time.Instant

abstract class DomainEvent {
    val occurredAt: Instant = Instant.now()
}
