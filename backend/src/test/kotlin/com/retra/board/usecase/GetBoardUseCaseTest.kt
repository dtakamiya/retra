package com.retra.board.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Framework
import com.retra.board.domain.Phase
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class GetBoardUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private lateinit var useCase: GetBoardUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = GetBoardUseCase(boardRepository)
    }

    @Test
    fun `ボード取得成功`() {
        val board = TestFixtures.board(title = "My Retro", framework = Framework.KPT, phase = Phase.WRITING)
        every { boardRepository.findBySlug("test1234") } returns board

        val response = useCase.execute("test1234")

        assertEquals("My Retro", response.title)
        assertEquals(Framework.KPT, response.framework)
        assertEquals(Phase.WRITING, response.phase)
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown")
        }
    }
}
