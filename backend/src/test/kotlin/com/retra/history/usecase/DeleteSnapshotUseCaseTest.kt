package com.retra.history.usecase

import com.retra.history.domain.BoardSnapshot
import com.retra.history.domain.BoardSnapshotRepository
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals

class DeleteSnapshotUseCaseTest {

    private val snapshotRepository: BoardSnapshotRepository = mockk()
    private lateinit var useCase: DeleteSnapshotUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = DeleteSnapshotUseCase(snapshotRepository)
    }

    @Test
    fun `正しいチーム名でスナップショットを削除できる`() {
        val snapshot = BoardSnapshot(id = "snap-1", teamName = "Team Alpha")
        every { snapshotRepository.findById("snap-1") } returns snapshot
        every { snapshotRepository.deleteById("snap-1") } just runs

        useCase.execute("snap-1", "Team Alpha")

        verify(exactly = 1) { snapshotRepository.findById("snap-1") }
        verify(exactly = 1) { snapshotRepository.deleteById("snap-1") }
    }

    @Test
    fun `存在しないスナップショットの削除でNotFoundExceptionが発生する`() {
        every { snapshotRepository.findById("nonexistent") } returns null

        val exception = assertThrows<NotFoundException> {
            useCase.execute("nonexistent", "Team Alpha")
        }

        assertEquals("Snapshot not found", exception.message)
        verify(exactly = 1) { snapshotRepository.findById("nonexistent") }
        verify(exactly = 0) { snapshotRepository.deleteById(any()) }
    }

    @Test
    fun `異なるチーム名での削除はForbiddenExceptionが発生する`() {
        val snapshot = BoardSnapshot(id = "snap-1", teamName = "Team Alpha")
        every { snapshotRepository.findById("snap-1") } returns snapshot

        val exception = assertThrows<ForbiddenException> {
            useCase.execute("snap-1", "Team Beta")
        }

        assertEquals("Cannot delete snapshot from another team", exception.message)
        verify(exactly = 0) { snapshotRepository.deleteById(any()) }
    }
}
