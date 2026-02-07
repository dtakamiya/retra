package com.retra.controller

import com.retra.domain.model.Framework
import com.retra.domain.model.Phase
import com.retra.dto.*
import com.retra.exception.ForbiddenException
import com.retra.exception.NotFoundException
import com.retra.service.BoardService
import com.retra.service.ParticipantService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class BoardControllerTest {

    private lateinit var boardService: BoardService
    private lateinit var participantService: ParticipantService
    private lateinit var controller: BoardController

    private val sampleBoard = BoardResponse(
        id = "board-1",
        slug = "test1234",
        title = "Test Retro",
        framework = Framework.KPT,
        phase = Phase.WRITING,
        maxVotesPerPerson = 5,
        columns = emptyList(),
        participants = emptyList(),
        createdAt = "2024-01-01T00:00:00Z",
        updatedAt = "2024-01-01T00:00:00Z"
    )

    @BeforeEach
    fun setUp() {
        boardService = mockk()
        participantService = mockk()
        controller = BoardController(boardService, participantService)
    }

    @Test
    fun `createBoard ボード作成成功`() {
        val request = CreateBoardRequest("Test", Framework.KPT)
        every { boardService.createBoard(request) } returns sampleBoard

        val result = controller.createBoard(request)

        assertEquals("test1234", result.slug)
        assertEquals("Test Retro", result.title)
        verify(exactly = 1) { boardService.createBoard(request) }
    }

    @Test
    fun `getBoard ボード取得成功`() {
        every { boardService.getBoard("test1234") } returns sampleBoard

        val result = controller.getBoard("test1234")

        assertEquals("test1234", result.slug)
        verify(exactly = 1) { boardService.getBoard("test1234") }
    }

    @Test
    fun `getBoard ボード未発見でNotFoundException`() {
        every { boardService.getBoard("notfound") } throws NotFoundException("Board not found")

        assertThrows(NotFoundException::class.java) {
            controller.getBoard("notfound")
        }
    }

    @Test
    fun `changePhase フェーズ変更成功`() {
        val request = ChangePhaseRequest(Phase.VOTING, "p-1")
        val updated = sampleBoard.copy(phase = Phase.VOTING)
        every { boardService.changePhase("test1234", request) } returns updated

        val result = controller.changePhase("test1234", request)

        assertEquals(Phase.VOTING, result.phase)
        verify(exactly = 1) { boardService.changePhase("test1234", request) }
    }

    @Test
    fun `changePhase 非ファシリテーターでForbiddenException`() {
        val request = ChangePhaseRequest(Phase.VOTING, "p-2")
        every { boardService.changePhase("test1234", request) } throws ForbiddenException("Only facilitator")

        assertThrows(ForbiddenException::class.java) {
            controller.changePhase("test1234", request)
        }
    }

    @Test
    fun `joinBoard 参加者追加成功`() {
        val request = JoinBoardRequest("Alice")
        val participant = ParticipantResponse("p-1", "Alice", true, true, "2024-01-01T00:00:00Z")
        every { participantService.joinBoard("test1234", request) } returns participant

        val result = controller.joinBoard("test1234", request)

        assertEquals("Alice", result.nickname)
        assertEquals(true, result.isFacilitator)
        verify(exactly = 1) { participantService.joinBoard("test1234", request) }
    }
}
