package com.retra.history.gateway.controller

import com.retra.history.usecase.DeleteSnapshotUseCase
import com.retra.history.usecase.GetSnapshotUseCase
import com.retra.history.usecase.GetTeamHistoryUseCase
import com.retra.history.usecase.PagedSnapshotResponse
import com.retra.history.usecase.SnapshotDetailResponse
import com.retra.history.usecase.SnapshotSummaryResponse
import com.retra.history.usecase.TrendDataResponse
import com.retra.history.usecase.TrendPoint
import com.retra.shared.domain.NotFoundException
import org.junit.jupiter.api.Test
import org.mockito.kotlin.eq
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(HistoryController::class)
class HistoryControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var getSnapshotUseCase: GetSnapshotUseCase

    @MockBean
    private lateinit var getTeamHistoryUseCase: GetTeamHistoryUseCase

    @MockBean
    private lateinit var deleteSnapshotUseCase: DeleteSnapshotUseCase

    private fun summaryResponse() = SnapshotSummaryResponse(
        id = "snap-1",
        teamName = "Team Alpha",
        framework = "KPT",
        closedAt = "2024-01-15T10:00:00Z",
        totalCards = 12,
        totalVotes = 24,
        totalParticipants = 4,
        actionItemsTotal = 3,
        actionItemsDone = 1
    )

    private fun pagedResponse() = PagedSnapshotResponse(
        content = listOf(summaryResponse()),
        totalElements = 1,
        totalPages = 1,
        currentPage = 0,
        pageSize = 10
    )

    private fun detailResponse() = SnapshotDetailResponse(
        id = "snap-1",
        teamName = "Team Alpha",
        framework = "KPT",
        closedAt = "2024-01-15T10:00:00Z",
        totalCards = 12,
        totalVotes = 24,
        totalParticipants = 4,
        actionItemsTotal = 3,
        actionItemsDone = 1,
        snapshotData = """{"columns":[]}"""
    )

    private fun trendResponse() = TrendDataResponse(
        snapshots = listOf(
            TrendPoint(
                closedAt = "2024-01-15T10:00:00Z",
                totalCards = 12,
                totalVotes = 24,
                totalParticipants = 4,
                actionItemsTotal = 3,
                actionItemsDone = 1,
                actionItemCompletionRate = 33.33,
                cardsPerParticipant = 3.0,
                votesPerParticipant = 6.0,
                votesPerCard = 2.0,
                actionItemRate = 25.0
            )
        )
    )

    @Test
    fun `GET history ページング付き履歴一覧取得 200`() {
        whenever(getTeamHistoryUseCase.getHistory(null, 0, 10)).thenReturn(pagedResponse())

        mockMvc.perform(
            get("/api/v1/history")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].id").value("snap-1"))
            .andExpect(jsonPath("$.content[0].teamName").value("Team Alpha"))
            .andExpect(jsonPath("$.content[0].framework").value("KPT"))
            .andExpect(jsonPath("$.content[0].totalCards").value(12))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.totalPages").value(1))
            .andExpect(jsonPath("$.currentPage").value(0))
            .andExpect(jsonPath("$.pageSize").value(10))
    }

    @Test
    fun `GET history page size パラメータ指定 200`() {
        val paged = PagedSnapshotResponse(
            content = listOf(summaryResponse()),
            totalElements = 25,
            totalPages = 5,
            currentPage = 2,
            pageSize = 5
        )
        whenever(getTeamHistoryUseCase.getHistory(null, 2, 5)).thenReturn(paged)

        mockMvc.perform(
            get("/api/v1/history")
                .param("page", "2")
                .param("size", "5")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.totalElements").value(25))
            .andExpect(jsonPath("$.totalPages").value(5))
            .andExpect(jsonPath("$.currentPage").value(2))
            .andExpect(jsonPath("$.pageSize").value(5))
    }

    @Test
    fun `GET history teamName チーム名フィルタ + ページング 200`() {
        whenever(getTeamHistoryUseCase.getHistory(eq("Team Alpha"), eq(0), eq(10))).thenReturn(pagedResponse())

        mockMvc.perform(
            get("/api/v1/history")
                .param("teamName", "Team Alpha")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].teamName").value("Team Alpha"))
            .andExpect(jsonPath("$.content[0].totalParticipants").value(4))
    }

    @Test
    fun `GET history id スナップショット詳細取得 200`() {
        whenever(getSnapshotUseCase.execute(eq("snap-1"))).thenReturn(detailResponse())

        mockMvc.perform(
            get("/api/v1/history/snap-1")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value("snap-1"))
            .andExpect(jsonPath("$.teamName").value("Team Alpha"))
            .andExpect(jsonPath("$.snapshotData").value("""{"columns":[]}"""))
            .andExpect(jsonPath("$.actionItemsTotal").value(3))
    }

    @Test
    fun `GET history trends トレンドデータ取得 200`() {
        whenever(getTeamHistoryUseCase.getTrends(null)).thenReturn(trendResponse())

        mockMvc.perform(
            get("/api/v1/history/trends")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.snapshots[0].closedAt").value("2024-01-15T10:00:00Z"))
            .andExpect(jsonPath("$.snapshots[0].totalCards").value(12))
            .andExpect(jsonPath("$.snapshots[0].actionItemCompletionRate").value(33.33))
    }

    @Test
    fun `DELETE history snapshotId スナップショット削除 204`() {
        mockMvc.perform(
            delete("/api/v1/history/snap-1")
                .param("teamName", "Team Alpha")
        )
            .andExpect(status().isNoContent)
    }

    @Test
    fun `DELETE history snapshotId teamNameなしで 400`() {
        mockMvc.perform(
            delete("/api/v1/history/snap-1")
        )
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `DELETE history snapshotId 存在しない場合 404`() {
        whenever(deleteSnapshotUseCase.execute(eq("nonexistent"), eq("Team Alpha"))).thenThrow(NotFoundException("Snapshot not found"))

        mockMvc.perform(
            delete("/api/v1/history/nonexistent")
                .param("teamName", "Team Alpha")
        )
            .andExpect(status().isNotFound)
    }
}
