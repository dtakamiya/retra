package com.retra.timer.gateway.controller

import com.retra.timer.usecase.TimerRequest
import com.retra.timer.usecase.TimerStateResponse
import com.retra.timer.usecase.TimerService
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
