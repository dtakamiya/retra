package com.retra.board.gateway.websocket

import com.retra.board.usecase.UpdateOnlineStatusUseCase
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.stereotype.Component
import org.springframework.web.socket.messaging.SessionConnectedEvent
import org.springframework.web.socket.messaging.SessionDisconnectEvent

@Component
class WebSocketEventListener(
    private val updateOnlineStatusUseCase: UpdateOnlineStatusUseCase
) {
    private val logger = LoggerFactory.getLogger(WebSocketEventListener::class.java)

    @EventListener
    fun handleWebSocketConnected(event: SessionConnectedEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        logger.info("WebSocket connected: sessionId=$sessionId")
    }

    @EventListener
    fun handleWebSocketDisconnected(event: SessionDisconnectEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId ?: return
        logger.info("WebSocket disconnected: sessionId=$sessionId")
        updateOnlineStatusUseCase.handleDisconnect(sessionId)
    }
}
