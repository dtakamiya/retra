package com.retra.board.gateway.websocket

import com.retra.board.usecase.UpdateOnlineStatusUseCase
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.messaging.Message
import org.springframework.messaging.MessageHeaders
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.messaging.SessionDisconnectEvent

class WebSocketEventListenerTest {

    private val updateOnlineStatusUseCase: UpdateOnlineStatusUseCase = mockk(relaxed = true)
    private lateinit var listener: WebSocketEventListener

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        listener = WebSocketEventListener(updateOnlineStatusUseCase)
    }

    @Test
    fun `切断時にhandleDisconnectが呼ばれる`() {
        val headers = mapOf(
            "simpSessionId" to "session-123"
        )
        val message = mockk<Message<ByteArray>>()
        every { message.headers } returns MessageHeaders(headers)
        every { message.payload } returns ByteArray(0)

        val event = SessionDisconnectEvent(this, message, "session-123", CloseStatus.NORMAL)

        listener.handleWebSocketDisconnected(event)

        verify { updateOnlineStatusUseCase.handleDisconnect("session-123") }
    }
}
