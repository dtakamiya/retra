package com.retra.history.usecase

import com.retra.TestFixtures
import com.retra.history.domain.BoardSnapshotRepository
import com.retra.shared.domain.NotFoundException
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class GetSnapshotUseCaseTest {

    private val snapshotRepository: BoardSnapshotRepository = mockk()
    private lateinit var useCase: GetSnapshotUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = GetSnapshotUseCase(snapshotRepository)
    }

    @Test
    fun `IDでスナップショットを取得できる`() {
        val snapshot = TestFixtures.boardSnapshot(
            id = "snap-1",
            teamName = "Team Alpha",
            framework = "KPT",
            totalCards = 10,
            totalVotes = 25,
            totalParticipants = 4,
            actionItemsTotal = 5,
            actionItemsDone = 3,
            snapshotData = """{"columns":[{"name":"Keep","cards":[]}]}"""
        )
        every { snapshotRepository.findById("snap-1") } returns snapshot

        val result = useCase.execute("snap-1")

        assertEquals("snap-1", result.id)
        assertEquals("Team Alpha", result.teamName)
        assertEquals("KPT", result.framework)
        assertEquals(10, result.totalCards)
        assertEquals(25, result.totalVotes)
        assertEquals(4, result.totalParticipants)
        assertEquals(5, result.actionItemsTotal)
        assertEquals(3, result.actionItemsDone)
        assertEquals("""{"columns":[{"name":"Keep","cards":[]}]}""", result.snapshotData)
    }

    @Test
    fun `存在しないスナップショットで NotFoundException`() {
        every { snapshotRepository.findById("unknown") } returns null

        val exception = assertFailsWith<NotFoundException> {
            useCase.execute("unknown")
        }
        assertEquals("スナップショットが見つかりません", exception.message)
    }
}
