package com.retra.history.usecase

import com.retra.history.domain.BoardSnapshotRepository
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
    fun `存在するスナップショットを削除できる`() {
        every { snapshotRepository.existsById("snap-1") } returns true
        every { snapshotRepository.deleteById("snap-1") } just runs

        useCase.execute("snap-1")

        verify(exactly = 1) { snapshotRepository.existsById("snap-1") }
        verify(exactly = 1) { snapshotRepository.deleteById("snap-1") }
    }

    @Test
    fun `存在しないスナップショットの削除でNotFoundExceptionが発生する`() {
        every { snapshotRepository.existsById("nonexistent") } returns false

        val exception = assertThrows<NotFoundException> {
            useCase.execute("nonexistent")
        }

        assertEquals("スナップショットが見つかりません", exception.message)
        verify(exactly = 1) { snapshotRepository.existsById("nonexistent") }
        verify(exactly = 0) { snapshotRepository.deleteById(any()) }
    }
}
