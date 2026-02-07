package com.retra.shared.gateway.event

import com.retra.shared.domain.DomainEvent
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Component

@Component
class SpringDomainEventPublisher(
    private val applicationEventPublisher: ApplicationEventPublisher
) {

    fun publishAll(events: List<DomainEvent>) {
        events.forEach { applicationEventPublisher.publishEvent(it) }
    }

    fun publish(event: DomainEvent) {
        applicationEventPublisher.publishEvent(event)
    }
}
