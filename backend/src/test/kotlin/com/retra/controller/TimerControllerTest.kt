package com.retra.controller

import com.retra.dto.TimerAction
import com.retra.dto.TimerRequest
import com.retra.dto.TimerStateResponse
import com.retra.service.TimerService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class TimerControllerTest {

    private lateinit var timerService: TimerService
    private lateinit var controller: TimerController

    @BeforeEach
    fun setUp() {
        timerService = mockk()
        controller = TimerController(timerService)
    }

    @Test
    fun `controlTimer タイマー制御成功`() {
        val request = TimerRequest(TimerAction.START, 300, "p-1")
        val response = TimerStateResponse(isRunning = true, remainingSeconds = 300, totalSeconds = 300)
        every { timerService.handleTimer("test1234", request) } returns response

        val result = controller.controlTimer("test1234", request)

        assertEquals(true, result.isRunning)
        assertEquals(300, result.remainingSeconds)
        assertEquals(300, result.totalSeconds)
        verify(exactly = 1) { timerService.handleTimer("test1234", request) }
    }

    @Test
    fun `getTimerState タイマー状態取得`() {
        val response = TimerStateResponse(isRunning = false, remainingSeconds = 0, totalSeconds = 0)
        every { timerService.getTimerState("test1234") } returns response

        val result = controller.getTimerState("test1234")

        assertEquals(false, result.isRunning)
        assertEquals(0, result.remainingSeconds)
        assertEquals(0, result.totalSeconds)
        verify(exactly = 1) { timerService.getTimerState("test1234") }
    }
}
