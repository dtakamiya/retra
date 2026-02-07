package com.retra.board.gateway.websocket

import com.retra.board.usecase.UpdateOnlineStatusUseCase
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.stereotype.Controller

data class RegisterSessionMessage(
    val participantId: String
)

@Controller
class WebSocketController(
    private val updateOnlineStatusUseCase: UpdateOnlineStatusUseCase
) {

    @MessageMapping("/board/{slug}/register")
    fun registerSession(
        @DestinationVariable slug: String,
        message: RegisterSessionMessage,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        val sessionId = headerAccessor.sessionId ?: return
        updateOnlineStatusUseCase.setSessionId(message.participantId, sessionId)
    }
}
