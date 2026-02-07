package com.retra.timer.usecase

data class TimerRequest(
    val action: TimerAction,
    val durationSeconds: Int? = null,
    val participantId: String
)

enum class TimerAction {
    START, PAUSE, RESUME, RESET
}

data class TimerStateResponse(
    val isRunning: Boolean,
    val remainingSeconds: Int,
    val totalSeconds: Int
)
