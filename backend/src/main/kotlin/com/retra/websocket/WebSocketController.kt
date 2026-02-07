package com.retra.websocket

import com.retra.service.ParticipantService
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.stereotype.Controller

data class RegisterSessionMessage(
    val participantId: String
)

@Controller
class WebSocketController(
    private val participantService: ParticipantService
) {

    @MessageMapping("/board/{slug}/register")
    fun registerSession(
        @DestinationVariable slug: String,
        message: RegisterSessionMessage,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        val sessionId = headerAccessor.sessionId ?: return
        participantService.setSessionId(message.participantId, sessionId)
    }
}
