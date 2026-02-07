package com.retra.controller

import com.retra.dto.TimerRequest
import com.retra.dto.TimerStateResponse
import com.retra.service.TimerService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/timer")
class TimerController(
    private val timerService: TimerService
) {

    @PostMapping
    fun controlTimer(
        @PathVariable slug: String,
        @RequestBody request: TimerRequest
    ): TimerStateResponse {
        return timerService.handleTimer(slug, request)
    }

    @GetMapping
    fun getTimerState(@PathVariable slug: String): TimerStateResponse {
        return timerService.getTimerState(slug)
    }
}
