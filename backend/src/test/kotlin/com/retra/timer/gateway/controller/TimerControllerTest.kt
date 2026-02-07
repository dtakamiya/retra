package com.retra.timer.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.timer.usecase.TimerAction
import com.retra.timer.usecase.TimerRequest
import com.retra.timer.usecase.TimerStateResponse
import com.retra.timer.usecase.TimerService
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(TimerController::class)
class TimerControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var timerService: TimerService

    @Test
    fun `POST timer タイマー制御`() {
        val response = TimerStateResponse(isRunning = true, remainingSeconds = 300, totalSeconds = 300)
        whenever(timerService.handleTimer(any(), any())).thenReturn(response)

        mockMvc.perform(
            post("/api/v1/boards/test1234/timer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(TimerRequest(TimerAction.START, 300, "p-1")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.isRunning").value(true))
            .andExpect(jsonPath("$.remainingSeconds").value(300))
    }

    @Test
    fun `GET timer タイマー状態取得`() {
        val response = TimerStateResponse(isRunning = false, remainingSeconds = 0, totalSeconds = 0)
        whenever(timerService.getTimerState("test1234")).thenReturn(response)

        mockMvc.perform(get("/api/v1/boards/test1234/timer"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.isRunning").value(false))
    }
}
