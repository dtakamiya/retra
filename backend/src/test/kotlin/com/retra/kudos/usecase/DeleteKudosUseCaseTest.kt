package com.retra.kudos.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.KudosEvent
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class DeleteKudosUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val kudosRepository = mockk<KudosRepository>()
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)

    private val useCase = DeleteKudosUseCase(boardRepository, kudosRepository, eventPublisher)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `自分が送ったKudosを削除できる`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1", board = board)
        val receiver = TestFixtures.participant(id = "receiver-1", isFacilitator = false, board = board)
        board.participants.addAll(listOf(sender, receiver))
        val kudos = TestFixtures.kudos(id = "k-1", board = board, sender = sender, receiver = receiver)

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findById("k-1") } returns kudos
        every { kudosRepository.delete(kudos) } just runs

        useCase.execute("test-slug", "k-1", "sender-1")

        verify { kudosRepository.delete(kudos) }
        verify { eventPublisher.publish(match<KudosEvent.KudosDeleted> { it.kudosId == "k-1" }) }
    }

    @Test
    fun `他人のKudosは削除できない`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1", board = board)
        val receiver = TestFixtures.participant(id = "receiver-1", isFacilitator = false, board = board)
        board.participants.addAll(listOf(sender, receiver))
        val kudos = TestFixtures.kudos(id = "k-1", board = board, sender = sender, receiver = receiver)

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findById("k-1") } returns kudos

        assertThrows<ForbiddenException> {
            useCase.execute("test-slug", "k-1", "receiver-1")
        }
    }

    @Test
    fun `ボードが存在しない場合NotFoundException`() {
        every { boardRepository.findBySlug("missing") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("missing", "k-1", "p-1")
        }
    }

    @Test
    fun `Kudosが存在しない場合NotFoundException`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findById("missing") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("test-slug", "missing", "p-1")
        }
    }

    @Test
    fun `別ボードのKudosは削除できない`() {
        val otherBoard = TestFixtures.board(id = "other-board")
        val sender = TestFixtures.participant(id = "sender-1")
        val kudos = TestFixtures.kudos(id = "k-1", board = otherBoard, sender = sender)
        val board = TestFixtures.board(id = "my-board")

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findById("k-1") } returns kudos

        assertThrows<NotFoundException> {
            useCase.execute("test-slug", "k-1", "sender-1")
        }
    }
}
