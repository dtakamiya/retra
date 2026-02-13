package com.retra.actionitem.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.actionitem.usecase.ActionItemResponse
import com.retra.actionitem.usecase.CreateActionItemRequest
import com.retra.actionitem.usecase.CreateActionItemUseCase
import com.retra.actionitem.usecase.DeleteActionItemRequest
import com.retra.actionitem.usecase.DeleteActionItemUseCase
import com.retra.actionitem.usecase.GetActionItemsUseCase
import com.retra.actionitem.usecase.UpdateActionItemRequest
import com.retra.actionitem.usecase.UpdateActionItemStatusRequest
import com.retra.actionitem.usecase.UpdateActionItemStatusUseCase
import com.retra.actionitem.usecase.UpdateActionItemUseCase
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(ActionItemController::class)
class ActionItemControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var createUseCase: CreateActionItemUseCase

    @MockBean
    private lateinit var updateUseCase: UpdateActionItemUseCase

    @MockBean
    private lateinit var updateStatusUseCase: UpdateActionItemStatusUseCase

    @MockBean
    private lateinit var deleteUseCase: DeleteActionItemUseCase

    @MockBean
    private lateinit var getUseCase: GetActionItemsUseCase

    private fun actionItemResponse() = ActionItemResponse(
        id = "ai-1",
        boardId = "board-1",
        cardId = "card-1",
        content = "Fix the login bug",
        assigneeId = "p-1",
        assigneeNickname = "Alice",
        dueDate = "2024-01-15",
        status = "OPEN",
        priority = "MEDIUM",
        sortOrder = 0,
        createdAt = "2024-01-01T00:00:00Z",
        updatedAt = "2024-01-01T00:00:00Z"
    )

    @Test
    fun `GET action-items アクションアイテム一覧取得 200`() {
        whenever(getUseCase.execute(any())).thenReturn(listOf(actionItemResponse()))

        mockMvc.perform(
            get("/api/v1/boards/test1234/action-items")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].content").value("Fix the login bug"))
            .andExpect(jsonPath("$[0].id").value("ai-1"))
    }

    @Test
    fun `POST action-items アクションアイテム作成 201`() {
        whenever(createUseCase.execute(any(), any())).thenReturn(actionItemResponse())

        mockMvc.perform(
            post("/api/v1/boards/test1234/action-items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    CreateActionItemRequest("Fix the login bug", "p-1", "card-1", "p-1", "2024-01-15")
                ))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.content").value("Fix the login bug"))
    }

    @Test
    fun `PUT action-items id アクションアイテム更新 200`() {
        val updated = actionItemResponse().copy(content = "Updated action item")
        whenever(updateUseCase.execute(any(), eq("ai-1"), any())).thenReturn(updated)

        mockMvc.perform(
            put("/api/v1/boards/test1234/action-items/ai-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    UpdateActionItemRequest("Updated action item", "p-1", "p-1", "2024-01-15")
                ))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").value("Updated action item"))
    }

    @Test
    fun `PATCH action-items id status ステータス更新 200`() {
        val updated = actionItemResponse().copy(status = "IN_PROGRESS")
        whenever(updateStatusUseCase.execute(any(), eq("ai-1"), any())).thenReturn(updated)

        mockMvc.perform(
            patch("/api/v1/boards/test1234/action-items/ai-1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    UpdateActionItemStatusRequest("IN_PROGRESS", "p-1")
                ))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
    }

    @Test
    fun `DELETE action-items id アクションアイテム削除 204`() {
        mockMvc.perform(
            delete("/api/v1/boards/test1234/action-items/ai-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    DeleteActionItemRequest("p-1")
                ))
        )
            .andExpect(status().isNoContent)
    }
}
