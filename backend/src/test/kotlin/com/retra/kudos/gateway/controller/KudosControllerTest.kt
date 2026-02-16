package com.retra.kudos.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.kudos.usecase.*
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(KudosController::class)
class KudosControllerTest {

    @TestConfiguration
    class Config {
        @Bean fun sendKudosUseCase() = mockk<SendKudosUseCase>()
        @Bean fun getKudosUseCase() = mockk<GetKudosUseCase>()
        @Bean fun deleteKudosUseCase() = mockk<DeleteKudosUseCase>()
    }

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var sendKudosUseCase: SendKudosUseCase
    @Autowired lateinit var getKudosUseCase: GetKudosUseCase
    @Autowired lateinit var deleteKudosUseCase: DeleteKudosUseCase

    private val objectMapper = ObjectMapper()

    @Test
    fun `POST kudos returns 201`() {
        val response = KudosResponse(
            id = "k-1", boardId = "b-1",
            senderId = "s-1", senderNickname = "Alice",
            receiverId = "r-1", receiverNickname = "Bob",
            category = "GREAT_JOB", message = "Good work!",
            createdAt = "2024-01-01T00:00:00Z"
        )
        every { sendKudosUseCase.execute("test-slug", any()) } returns response

        val body = objectMapper.writeValueAsString(
            SendKudosRequest("s-1", "r-1", "GREAT_JOB", "Good work!")
        )

        mockMvc.perform(
            post("/api/v1/boards/test-slug/kudos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.id").value("k-1"))
            .andExpect(jsonPath("$.senderNickname").value("Alice"))
            .andExpect(jsonPath("$.receiverNickname").value("Bob"))
            .andExpect(jsonPath("$.category").value("GREAT_JOB"))
            .andExpect(jsonPath("$.message").value("Good work!"))
    }

    @Test
    fun `GET kudos returns 200`() {
        val kudosList = listOf(
            KudosResponse("k-1", "b-1", "s-1", "Alice", "r-1", "Bob", "GREAT_JOB", null, "2024-01-01T00:00:00Z")
        )
        every { getKudosUseCase.execute("test-slug") } returns kudosList

        mockMvc.perform(get("/api/v1/boards/test-slug/kudos"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value("k-1"))
    }

    @Test
    fun `DELETE kudos returns 204`() {
        every { deleteKudosUseCase.execute("test-slug", "k-1", "p-1") } just runs

        mockMvc.perform(
            delete("/api/v1/boards/test-slug/kudos/k-1")
                .param("participantId", "p-1")
        )
            .andExpect(status().isNoContent)
    }
}
