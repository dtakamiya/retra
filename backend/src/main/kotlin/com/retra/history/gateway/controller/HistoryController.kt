package com.retra.history.gateway.controller

import com.retra.history.usecase.DeleteSnapshotUseCase
import com.retra.history.usecase.GetSnapshotUseCase
import com.retra.history.usecase.GetTeamHistoryUseCase
import com.retra.history.usecase.PagedSnapshotResponse
import com.retra.history.usecase.SnapshotDetailResponse
import com.retra.history.usecase.TrendDataResponse
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/history")
class HistoryController(
    private val getSnapshotUseCase: GetSnapshotUseCase,
    private val getTeamHistoryUseCase: GetTeamHistoryUseCase,
    private val deleteSnapshotUseCase: DeleteSnapshotUseCase
) {

    @GetMapping
    fun getHistory(
        @RequestParam(required = false) teamName: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): PagedSnapshotResponse {
        return getTeamHistoryUseCase.getHistory(teamName, page, size)
    }

    @GetMapping("/{snapshotId}")
    fun getSnapshot(@PathVariable snapshotId: String): SnapshotDetailResponse {
        return getSnapshotUseCase.execute(snapshotId)
    }

    @GetMapping("/trends")
    fun getTrends(@RequestParam(required = false) teamName: String?): TrendDataResponse {
        return getTeamHistoryUseCase.getTrends(teamName)
    }

    @DeleteMapping("/{snapshotId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteSnapshot(@PathVariable snapshotId: String) {
        deleteSnapshotUseCase.execute(snapshotId)
    }
}
