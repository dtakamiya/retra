package com.retra.card.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.card.usecase.CardResponse
import com.retra.card.usecase.CreateCardRequest
import com.retra.card.usecase.CreateCardUseCase
import com.retra.card.usecase.DeleteCardRequest
import com.retra.card.usecase.DeleteCardUseCase
import com.retra.card.usecase.MarkCardDiscussedRequest
import com.retra.card.usecase.MarkCardDiscussedUseCase
import com.retra.card.usecase.MoveCardRequest
import com.retra.card.usecase.MoveCardUseCase
import com.retra.card.usecase.UpdateCardRequest
import com.retra.card.usecase.UpdateCardUseCase
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

@WebMvcTest(CardController::class)
class CardControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var createCardUseCase: CreateCardUseCase

    @MockBean
    private lateinit var updateCardUseCase: UpdateCardUseCase

    @MockBean
    private lateinit var deleteCardUseCase: DeleteCardUseCase

    @MockBean
    private lateinit var moveCardUseCase: MoveCardUseCase

    @MockBean
    private lateinit var markCardDiscussedUseCase: MarkCardDiscussedUseCase

    private fun cardResponse() = CardResponse(
        id = "card-1",
        columnId = "col-1",
        content = "Test card",
        authorNickname = "Alice",
        participantId = "p-1",
        voteCount = 0,
        sortOrder = 0,
        createdAt = "2024-01-01T00:00:00Z",
        updatedAt = "2024-01-01T00:00:00Z",
        memos = emptyList()
    )

    @Test
    fun `POST cards カード作成 201`() {
        whenever(createCardUseCase.execute(any(), any())).thenReturn(cardResponse())

        mockMvc.perform(
            post("/api/v1/boards/test1234/cards")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(CreateCardRequest("col-1", "Test card", "p-1")))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.content").value("Test card"))
    }

    @Test
    fun `PUT cards cardId カード更新 200`() {
        val updated = cardResponse().copy(content = "Updated")
        whenever(updateCardUseCase.execute(any(), eq("card-1"), any())).thenReturn(updated)

        mockMvc.perform(
            put("/api/v1/boards/test1234/cards/card-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(UpdateCardRequest("Updated", "p-1")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").value("Updated"))
    }

    @Test
    fun `DELETE cards cardId カード削除 204`() {
        mockMvc.perform(
            delete("/api/v1/boards/test1234/cards/card-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(DeleteCardRequest("p-1")))
        )
            .andExpect(status().isNoContent)
    }

    @Test
    fun `PATCH cards cardId move カード移動 204`() {
        mockMvc.perform(
            patch("/api/v1/boards/test1234/cards/card-1/move")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(MoveCardRequest("col-2", 0, "p-1")))
        )
            .andExpect(status().isNoContent)
    }
}
