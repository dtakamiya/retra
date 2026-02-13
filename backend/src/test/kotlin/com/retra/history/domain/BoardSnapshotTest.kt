package com.retra.history.domain

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class BoardSnapshotTest {

    @Test
    fun `create factory creates snapshot with correct properties`() {
        val snapshot = BoardSnapshot.create(
            boardId = "board-123",
            teamName = "Team Alpha",
            framework = "KPT",
            closedAt = "2025-01-15T10:00:00Z",
            totalCards = 12,
            totalVotes = 30,
            totalParticipants = 5,
            actionItemsTotal = 3,
            actionItemsDone = 1,
            snapshotData = """{"columns":[]}"""
        )

        assertNotNull(snapshot.id)
        assertEquals("board-123", snapshot.boardId)
        assertEquals("Team Alpha", snapshot.teamName)
        assertEquals("KPT", snapshot.framework)
        assertEquals("2025-01-15T10:00:00Z", snapshot.closedAt)
        assertEquals(12, snapshot.totalCards)
        assertEquals(30, snapshot.totalVotes)
        assertEquals(5, snapshot.totalParticipants)
        assertEquals(3, snapshot.actionItemsTotal)
        assertEquals(1, snapshot.actionItemsDone)
        assertEquals("""{"columns":[]}""", snapshot.snapshotData)
        assertNotNull(snapshot.createdAt)
    }

    @Test
    fun `default values are set correctly`() {
        val snapshot = BoardSnapshot()

        assertNotNull(snapshot.id)
        assertEquals("", snapshot.boardId)
        assertEquals("", snapshot.teamName)
        assertEquals("", snapshot.framework)
        assertEquals("", snapshot.closedAt)
        assertEquals(0, snapshot.totalCards)
        assertEquals(0, snapshot.totalVotes)
        assertEquals(0, snapshot.totalParticipants)
        assertEquals(0, snapshot.actionItemsTotal)
        assertEquals(0, snapshot.actionItemsDone)
        assertEquals("{}", snapshot.snapshotData)
        assertNotNull(snapshot.createdAt)
    }

    @Test
    fun `snapshotData defaults to empty JSON object`() {
        val snapshot = BoardSnapshot()

        assertEquals("{}", snapshot.snapshotData)
    }

    @Test
    fun `create factory generates unique IDs`() {
        val snapshot1 = BoardSnapshot.create(
            boardId = "board-1",
            teamName = "Team A",
            framework = "KPT",
            closedAt = "2025-01-15T10:00:00Z",
            totalCards = 5,
            totalVotes = 10,
            totalParticipants = 3,
            actionItemsTotal = 2,
            actionItemsDone = 0,
            snapshotData = "{}"
        )

        val snapshot2 = BoardSnapshot.create(
            boardId = "board-1",
            teamName = "Team A",
            framework = "KPT",
            closedAt = "2025-01-15T11:00:00Z",
            totalCards = 5,
            totalVotes = 10,
            totalParticipants = 3,
            actionItemsTotal = 2,
            actionItemsDone = 0,
            snapshotData = "{}"
        )

        assertNotEquals(snapshot1.id, snapshot2.id)
    }
}
