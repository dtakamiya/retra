package com.retra.history.gateway.controller

import com.retra.history.usecase.GetSnapshotUseCase
import com.retra.history.usecase.GetTeamHistoryUseCase
import com.retra.history.usecase.SnapshotDetailResponse
import com.retra.history.usecase.SnapshotSummaryResponse
import com.retra.history.usecase.TrendDataResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/history")
class HistoryController(
    private val getSnapshotUseCase: GetSnapshotUseCase,
    private val getTeamHistoryUseCase: GetTeamHistoryUseCase
) {

    @GetMapping
    fun getHistory(@RequestParam(required = false) teamName: String?): List<SnapshotSummaryResponse> {
        return getTeamHistoryUseCase.getHistory(teamName)
    }

    @GetMapping("/{snapshotId}")
    fun getSnapshot(@PathVariable snapshotId: String): SnapshotDetailResponse {
        return getSnapshotUseCase.execute(snapshotId)
    }

    @GetMapping("/trends")
    fun getTrends(@RequestParam(required = false) teamName: String?): TrendDataResponse {
        return getTeamHistoryUseCase.getTrends(teamName)
    }
}
