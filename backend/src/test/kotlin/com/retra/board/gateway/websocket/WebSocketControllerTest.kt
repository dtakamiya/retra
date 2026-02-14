package com.retra.board.gateway.websocket

import com.retra.board.usecase.UpdateOnlineStatusUseCase
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.messaging.simp.SimpMessageHeaderAccessor

class WebSocketControllerTest {

    private val updateOnlineStatusUseCase: UpdateOnlineStatusUseCase = mockk(relaxed = true)
    private lateinit var controller: WebSocketController

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        controller = WebSocketController(updateOnlineStatusUseCase)
    }

    @Test
    fun `registerSession でセッションIDが存在する場合はsetSessionIdが呼ばれる`() {
        val headerAccessor = mockk<SimpMessageHeaderAccessor>()
        every { headerAccessor.sessionId } returns "session-123"
        val message = RegisterSessionMessage(participantId = "p-1")

        controller.registerSession("test-slug", message, headerAccessor)

        verify(exactly = 1) { updateOnlineStatusUseCase.setSessionId("p-1", "session-123") }
    }

    @Test
    fun `registerSession でセッションIDがnullの場合はsetSessionIdが呼ばれない`() {
        val headerAccessor = mockk<SimpMessageHeaderAccessor>()
        every { headerAccessor.sessionId } returns null
        val message = RegisterSessionMessage(participantId = "p-1")

        controller.registerSession("test-slug", message, headerAccessor)

        verify(exactly = 0) { updateOnlineStatusUseCase.setSessionId(any(), any()) }
    }

    @Test
    fun `RegisterSessionMessage のプロパティが正しく保持される`() {
        val message = RegisterSessionMessage(participantId = "participant-abc")
        kotlin.test.assertEquals("participant-abc", message.participantId)
    }
}
