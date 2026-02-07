package com.retra.shared.gateway.event

import com.retra.shared.domain.DomainEvent
import io.mockk.clearAllMocks
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher

class SpringDomainEventPublisherTest {

    private val applicationEventPublisher: ApplicationEventPublisher = mockk(relaxed = true)
    private lateinit var publisher: SpringDomainEventPublisher

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        publisher = SpringDomainEventPublisher(applicationEventPublisher)
    }

    @Test
    fun `publish で単一イベントが発行される`() {
        val event = mockk<DomainEvent>()

        publisher.publish(event)

        verify(exactly = 1) { applicationEventPublisher.publishEvent(event) }
    }

    @Test
    fun `publishAll で複数イベントが順番に発行される`() {
        val event1 = mockk<DomainEvent>()
        val event2 = mockk<DomainEvent>()
        val event3 = mockk<DomainEvent>()

        publisher.publishAll(listOf(event1, event2, event3))

        verify(exactly = 1) { applicationEventPublisher.publishEvent(event1) }
        verify(exactly = 1) { applicationEventPublisher.publishEvent(event2) }
        verify(exactly = 1) { applicationEventPublisher.publishEvent(event3) }
    }

    @Test
    fun `publishAll で空リストの場合は何も発行されない`() {
        publisher.publishAll(emptyList())

        verify(exactly = 0) { applicationEventPublisher.publishEvent(any()) }
    }
}
