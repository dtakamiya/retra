package com.retra.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.scheduling.TaskScheduler
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    @Value("\${app.cors.allowed-origins}")
    private val allowedOriginsStr: String
) : WebSocketMessageBrokerConfigurer {

    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        config.enableSimpleBroker("/topic")
            .setHeartbeatValue(longArrayOf(10000, 10000))
            .setTaskScheduler(heartbeatScheduler())
        config.setApplicationDestinationPrefixes("/app")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        val origins = allowedOriginsStr.split(",").map { it.trim() }.toTypedArray()
        registry.addEndpoint("/ws")
            .setAllowedOrigins(*origins)
            .withSockJS()
        registry.addEndpoint("/ws")
            .setAllowedOrigins(*origins)
    }

    override fun configureWebSocketTransport(configurer: WebSocketTransportRegistration) {
        configurer.setSendTimeLimit(15 * 1000)
        configurer.setSendBufferSizeLimit(512 * 1024)
        configurer.setMessageSizeLimit(128 * 1024)
    }

    @Bean
    fun heartbeatScheduler(): TaskScheduler {
        val scheduler = ThreadPoolTaskScheduler()
        scheduler.poolSize = 1
        scheduler.setThreadNamePrefix("ws-heartbeat-")
        scheduler.initialize()
        return scheduler
    }
}
