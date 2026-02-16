package com.retra.kudos.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.KudosCategory
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.NotFoundException
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals

class GetKudosUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val kudosRepository = mockk<KudosRepository>()

    private val useCase = GetKudosUseCase(boardRepository, kudosRepository)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `ボードのKudos一覧を取得できる`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1", nickname = "Alice", board = board)
        val receiver = TestFixtures.participant(id = "receiver-1", nickname = "Bob", isFacilitator = false, board = board)
        board.participants.addAll(listOf(sender, receiver))
        val kudos1 = TestFixtures.kudos(id = "k-1", board = board, sender = sender, receiver = receiver, category = KudosCategory.GREAT_JOB)
        val kudos2 = TestFixtures.kudos(id = "k-2", board = board, sender = receiver, receiver = sender, category = KudosCategory.THANK_YOU)

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findByBoardId(board.id) } returns listOf(kudos1, kudos2)

        val result = useCase.execute("test-slug")

        assertEquals(2, result.size)
        assertEquals("k-1", result[0].id)
        assertEquals("k-2", result[1].id)
    }

    @Test
    fun `ボードが存在しない場合NotFoundException`() {
        every { boardRepository.findBySlug("missing") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("missing")
        }
    }

    @Test
    fun `Kudosが0件の場合は空リストを返す`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findByBoardId(board.id) } returns emptyList()

        val result = useCase.execute("test-slug")
        assertEquals(0, result.size)
    }
}
