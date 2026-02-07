package com.retra.card.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.card.usecase.CreateMemoRequest
import com.retra.card.usecase.CreateMemoUseCase
import com.retra.card.usecase.DeleteMemoRequest
import com.retra.card.usecase.DeleteMemoUseCase
import com.retra.card.usecase.MemoResponse
import com.retra.card.usecase.UpdateMemoRequest
import com.retra.card.usecase.UpdateMemoUseCase
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

@WebMvcTest(MemoController::class)
class MemoControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var createMemoUseCase: CreateMemoUseCase

    @MockBean
    private lateinit var updateMemoUseCase: UpdateMemoUseCase

    @MockBean
    private lateinit var deleteMemoUseCase: DeleteMemoUseCase

    private fun memoResponse() = MemoResponse(
        id = "memo-1",
        cardId = "card-1",
        content = "Test memo",
        authorNickname = "Alice",
        participantId = "p-1",
        createdAt = "2024-01-01T00:00:00Z",
        updatedAt = "2024-01-01T00:00:00Z"
    )

    @Test
    fun `POST memos メモ作成 201`() {
        whenever(createMemoUseCase.execute(any(), any(), any())).thenReturn(memoResponse())

        mockMvc.perform(
            post("/api/v1/boards/test1234/cards/card-1/memos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(CreateMemoRequest("Test memo", "p-1")))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.content").value("Test memo"))
    }

    @Test
    fun `PUT memos memoId メモ更新 200`() {
        val updated = memoResponse().copy(content = "Updated memo")
        whenever(updateMemoUseCase.execute(any(), any(), eq("memo-1"), any())).thenReturn(updated)

        mockMvc.perform(
            put("/api/v1/boards/test1234/cards/card-1/memos/memo-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(UpdateMemoRequest("Updated memo", "p-1")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").value("Updated memo"))
    }

    @Test
    fun `DELETE memos memoId メモ削除 204`() {
        mockMvc.perform(
            delete("/api/v1/boards/test1234/cards/card-1/memos/memo-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(DeleteMemoRequest("p-1")))
        )
            .andExpect(status().isNoContent)
    }
}
