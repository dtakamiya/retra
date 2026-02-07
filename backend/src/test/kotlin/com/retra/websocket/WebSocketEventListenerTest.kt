package com.retra.websocket

import com.retra.service.ParticipantService
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.messaging.Message
import org.springframework.messaging.MessageHeaders
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.web.socket.messaging.SessionConnectedEvent
import org.springframework.web.socket.messaging.SessionDisconnectEvent

class WebSocketEventListenerTest {

    private val participantService: ParticipantService = mockk(relaxed = true)
    private lateinit var listener: WebSocketEventListener

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        listener = WebSocketEventListener(participantService)
    }

    @Test
    fun `切断イベントでhandleDisconnectが呼ばれる`() {
        val headers = mapOf(
            SimpMessageHeaderAccessor.SESSION_ID_HEADER to "session-123"
        )
        val message = mockk<Message<ByteArray>>()
        every { message.headers } returns MessageHeaders(headers)
        every { message.payload } returns ByteArray(0)

        val event = mockk<SessionDisconnectEvent>()
        every { event.message } returns message

        listener.handleWebSocketDisconnected(event)

        verify { participantService.handleDisconnect("session-123") }
    }

    @Test
    fun `セッションIDがnullの場合handleDisconnectは呼ばれない`() {
        val headers = emptyMap<String, Any>()
        val message = mockk<Message<ByteArray>>()
        every { message.headers } returns MessageHeaders(headers)
        every { message.payload } returns ByteArray(0)

        val event = mockk<SessionDisconnectEvent>()
        every { event.message } returns message

        listener.handleWebSocketDisconnected(event)

        verify(exactly = 0) { participantService.handleDisconnect(any()) }
    }
}
