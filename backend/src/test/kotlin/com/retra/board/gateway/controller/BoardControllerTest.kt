package com.retra.board.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.board.usecase.*
import com.retra.board.domain.Framework
import com.retra.board.domain.Phase
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(BoardController::class)
class BoardControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var createBoardUseCase: CreateBoardUseCase

    @MockBean
    private lateinit var getBoardUseCase: GetBoardUseCase

    @MockBean
    private lateinit var transitionPhaseUseCase: TransitionPhaseUseCase

    @MockBean
    private lateinit var joinBoardUseCase: JoinBoardUseCase

    @MockBean
    private lateinit var exportBoardUseCase: ExportBoardUseCase

    private fun boardResponse() = BoardResponse(
        id = "board-1",
        slug = "test1234",
        title = "My Retro",
        teamName = null,
        framework = Framework.KPT,
        phase = Phase.WRITING,
        maxVotesPerPerson = 5,
        isAnonymous = false,
        privateWriting = false,
        columns = listOf(
            ColumnResponse("col-1", "Keep", 0, "#22c55e", emptyList()),
            ColumnResponse("col-2", "Problem", 1, "#ef4444", emptyList()),
            ColumnResponse("col-3", "Try", 2, "#3b82f6", emptyList())
        ),
        participants = emptyList(),
        createdAt = "2024-01-01T00:00:00Z",
        updatedAt = "2024-01-01T00:00:00Z"
    )

    @Test
    fun `POST boards ボード作成 201`() {
        whenever(createBoardUseCase.execute(any())).thenReturn(boardResponse())

        mockMvc.perform(
            post("/api/v1/boards")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(CreateBoardRequest("My Retro")))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.title").value("My Retro"))
            .andExpect(jsonPath("$.slug").value("test1234"))
    }

    @Test
    fun `GET boards slug ボード取得 200`() {
        whenever(getBoardUseCase.execute(any(), anyOrNull())).thenReturn(boardResponse())

        mockMvc.perform(get("/api/v1/boards/test1234"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.title").value("My Retro"))
            .andExpect(jsonPath("$.columns").isArray)
    }

    @Test
    fun `PATCH boards slug phase フェーズ遷移 200`() {
        val response = boardResponse().copy(phase = Phase.VOTING)
        whenever(transitionPhaseUseCase.execute(any(), any())).thenReturn(response)

        mockMvc.perform(
            patch("/api/v1/boards/test1234/phase")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ChangePhaseRequest(Phase.VOTING, "p-1")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.phase").value("VOTING"))
    }

    @Test
    fun `POST boards slug participants 参加 201`() {
        val response = ParticipantResponse("p-1", "Alice", true, true, "2024-01-01T00:00:00Z")
        whenever(joinBoardUseCase.execute(any(), any())).thenReturn(response)

        mockMvc.perform(
            post("/api/v1/boards/test1234/participants")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(JoinBoardRequest("Alice")))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.nickname").value("Alice"))
            .andExpect(jsonPath("$.isFacilitator").value(true))
    }

    @Test
    fun `GET boards slug export CSVエクスポート 200`() {
        whenever(exportBoardUseCase.execute(any(), any())).thenReturn("csv-data".toByteArray())

        mockMvc.perform(
            get("/api/v1/boards/test1234/export")
                .param("participantId", "p-1")
                .param("format", "CSV")
        )
            .andExpect(status().isOk)
            .andExpect(header().exists("Content-Disposition"))
            .andExpect(content().contentType("text/csv;charset=UTF-8"))
    }

    @Test
    fun `GET boards slug export Markdownエクスポート 200`() {
        whenever(exportBoardUseCase.execute(any(), any())).thenReturn("# markdown".toByteArray())

        mockMvc.perform(
            get("/api/v1/boards/test1234/export")
                .param("participantId", "p-1")
                .param("format", "MARKDOWN")
        )
            .andExpect(status().isOk)
            .andExpect(header().exists("Content-Disposition"))
            .andExpect(content().contentType("text/markdown;charset=UTF-8"))
    }
}
