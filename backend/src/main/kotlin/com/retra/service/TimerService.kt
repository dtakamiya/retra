package com.retra.service

import com.retra.dto.TimerAction
import com.retra.dto.TimerRequest
import com.retra.dto.TimerStateResponse
import com.retra.exception.BadRequestException
import com.retra.exception.ForbiddenException
import com.retra.exception.NotFoundException
import com.retra.websocket.WebSocketMessage
import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

@Service
class TimerService(
    private val boardService: BoardService,
    private val messagingTemplate: SimpMessagingTemplate
) {
    private val logger = LoggerFactory.getLogger(TimerService::class.java)

    private data class TimerState(
        var remainingSeconds: Int = 0,
        var totalSeconds: Int = 0,
        var isRunning: Boolean = false
    )

    companion object {
        private const val DEFAULT_TIMER_DURATION_SECONDS = 300
        private const val MAX_TIMER_DURATION_SECONDS = 3600
    }

    private val timers = ConcurrentHashMap<String, TimerState>()
    private val scheduledTasks = ConcurrentHashMap<String, ScheduledFuture<*>>()
    private val scheduler = Executors.newScheduledThreadPool(2)

    @PreDestroy
    fun shutdown() {
        scheduledTasks.values.forEach { it.cancel(false) }
        scheduler.shutdown()
        if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
            scheduler.shutdownNow()
        }
    }

    @Transactional(readOnly = true)
    fun handleTimer(slug: String, request: TimerRequest): TimerStateResponse {
        val board = boardService.findBoardBySlug(slug)
        val participant = board.participants.find { it.id == request.participantId }
            ?: throw NotFoundException("Participant not found")

        if (!participant.isFacilitator) {
            throw ForbiddenException("Only facilitator can control timer")
        }

        val state = timers.getOrPut(slug) { TimerState() }

        synchronized(state) {
            when (request.action) {
                TimerAction.START -> {
                    val duration = request.durationSeconds ?: DEFAULT_TIMER_DURATION_SECONDS
                    if (duration !in 1..MAX_TIMER_DURATION_SECONDS) {
                        throw BadRequestException("Duration must be between 1 and $MAX_TIMER_DURATION_SECONDS seconds")
                    }
                    state.totalSeconds = duration
                    state.remainingSeconds = duration
                    state.isRunning = true
                    startBroadcasting(slug)
                }
                TimerAction.PAUSE -> {
                    state.isRunning = false
                    stopBroadcasting(slug)
                    broadcastTimerState(slug, state)
                }
                TimerAction.RESUME -> {
                    if (state.remainingSeconds > 0) {
                        state.isRunning = true
                        startBroadcasting(slug)
                    }
                }
                TimerAction.RESET -> {
                    state.isRunning = false
                    state.remainingSeconds = 0
                    state.totalSeconds = 0
                    stopBroadcasting(slug)
                    broadcastTimerState(slug, state)
                }
            }

            return TimerStateResponse(
                isRunning = state.isRunning,
                remainingSeconds = state.remainingSeconds,
                totalSeconds = state.totalSeconds
            )
        }
    }

    fun getTimerState(slug: String): TimerStateResponse {
        val state = timers[slug] ?: return TimerStateResponse(
            isRunning = false,
            remainingSeconds = 0,
            totalSeconds = 0
        )
        synchronized(state) {
            return TimerStateResponse(
                isRunning = state.isRunning,
                remainingSeconds = state.remainingSeconds,
                totalSeconds = state.totalSeconds
            )
        }
    }

    private fun startBroadcasting(slug: String) {
        stopBroadcasting(slug)

        val future = scheduler.scheduleAtFixedRate({
            try {
                val state = timers[slug] ?: return@scheduleAtFixedRate
                synchronized(state) {
                    if (state.isRunning && state.remainingSeconds > 0) {
                        state.remainingSeconds--
                        broadcastTimerState(slug, state)

                        if (state.remainingSeconds <= 0) {
                            state.isRunning = false
                            stopBroadcasting(slug)
                        }
                    }
                }
            } catch (e: Exception) {
                logger.error("Timer broadcast failed for board $slug", e)
            }
        }, 1, 1, TimeUnit.SECONDS)

        scheduledTasks[slug] = future
    }

    private fun stopBroadcasting(slug: String) {
        scheduledTasks.remove(slug)?.cancel(false)
    }

    private fun broadcastTimerState(slug: String, state: TimerState) {
        messagingTemplate.convertAndSend(
            "/topic/board/$slug/timer",
            WebSocketMessage(
                "TIMER_UPDATE",
                TimerStateResponse(
                    isRunning = state.isRunning,
                    remainingSeconds = state.remainingSeconds,
                    totalSeconds = state.totalSeconds
                )
            )
        )
    }
}
