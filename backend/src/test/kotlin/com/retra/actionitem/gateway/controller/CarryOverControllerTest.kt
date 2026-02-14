package com.retra.actionitem.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.actionitem.usecase.*
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(CarryOverController::class)
class CarryOverControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var getCarryOverItemsUseCase: GetCarryOverItemsUseCase

    @MockBean
    private lateinit var updateCarryOverItemStatusUseCase: UpdateCarryOverItemStatusUseCase

    @Test
    fun `GET carry-over-items returns 200 with items`() {
        val response = CarryOverItemsResponse(
            items = listOf(
                CarryOverItemResponse(
                    id = "ai-1", content = "テスト自動化",
                    assigneeNickname = "田中", dueDate = "2026-02-20",
                    status = "OPEN", priority = "HIGH",
                    sourceBoardTitle = "Sprint 42", sourceBoardClosedAt = "2026-02-07T10:00:00Z",
                    sourceBoardSlug = "abc123"
                )
            ),
            teamName = "チーム Alpha"
        )
        whenever(getCarryOverItemsUseCase.execute("test-slug")).thenReturn(response)

        mockMvc.perform(get("/api/v1/boards/test-slug/carry-over-items"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.teamName").value("チーム Alpha"))
            .andExpect(jsonPath("$.items[0].content").value("テスト自動化"))
            .andExpect(jsonPath("$.items[0].sourceBoardSlug").value("abc123"))
            .andExpect(jsonPath("$.items[0].priority").value("HIGH"))
    }

    @Test
    fun `GET carry-over-items returns 200 with empty items`() {
        val response = CarryOverItemsResponse(items = emptyList(), teamName = "チーム Alpha")
        whenever(getCarryOverItemsUseCase.execute("test-slug")).thenReturn(response)

        mockMvc.perform(get("/api/v1/boards/test-slug/carry-over-items"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.items").isEmpty)
            .andExpect(jsonPath("$.teamName").value("チーム Alpha"))
    }

    @Test
    fun `PATCH carry-over-items status returns 204 No Content`() {
        mockMvc.perform(
            patch("/api/v1/boards/test-slug/carry-over-items/ai-1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mapOf("status" to "DONE", "participantId" to "p-1")))
        )
            .andExpect(status().isNoContent)

        verify(updateCarryOverItemStatusUseCase).execute(eq("test-slug"), eq("ai-1"), any())
    }
}
