package com.retra.kudos.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.kudos.domain.KudosCategory
import com.retra.kudos.domain.KudosEvent
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals

class SendKudosUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val kudosRepository = mockk<KudosRepository>()
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)

    private val useCase = SendKudosUseCase(boardRepository, kudosRepository, eventPublisher)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `Kudos送信に成功する`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1", nickname = "Alice", board = board)
        val receiver = TestFixtures.participant(id = "receiver-1", nickname = "Bob", isFacilitator = false, board = board)
        board.participants.addAll(listOf(sender, receiver))

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.save(any()) } answers { firstArg() }

        val request = SendKudosRequest(
            senderId = "sender-1",
            receiverId = "receiver-1",
            category = "GREAT_JOB",
            message = "素晴らしい！"
        )

        val response = useCase.execute("test-slug", request)

        assertEquals("sender-1", response.senderId)
        assertEquals("Alice", response.senderNickname)
        assertEquals("receiver-1", response.receiverId)
        assertEquals("Bob", response.receiverNickname)
        assertEquals("GREAT_JOB", response.category)
        assertEquals("素晴らしい！", response.message)

        verify { kudosRepository.save(any()) }
        verify { eventPublisher.publish(match<KudosEvent.KudosSent> {
            it.senderId == "sender-1" && it.receiverId == "receiver-1" && it.category == KudosCategory.GREAT_JOB
        }) }
    }

    @Test
    fun `ボードが存在しない場合NotFoundException`() {
        every { boardRepository.findBySlug("missing") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("missing", SendKudosRequest("s", "r", "GREAT_JOB"))
        }
    }

    @Test
    fun `送信者がボードの参加者でない場合NotFoundException`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)

        every { boardRepository.findBySlug("test-slug") } returns board

        assertThrows<NotFoundException> {
            useCase.execute("test-slug", SendKudosRequest("unknown", "p-1", "GREAT_JOB"))
        }
    }

    @Test
    fun `受信者がボードの参加者でない場合NotFoundException`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)

        every { boardRepository.findBySlug("test-slug") } returns board

        assertThrows<NotFoundException> {
            useCase.execute("test-slug", SendKudosRequest("p-1", "unknown", "GREAT_JOB"))
        }
    }

    @Test
    fun `自分自身にKudosを送れない`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(id = "p-1", board = board)
        board.participants.add(participant)

        every { boardRepository.findBySlug("test-slug") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test-slug", SendKudosRequest("p-1", "p-1", "GREAT_JOB"))
        }
    }

    @Test
    fun `不正なカテゴリの場合BadRequestException`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1", board = board)
        val receiver = TestFixtures.participant(id = "receiver-1", isFacilitator = false, board = board)
        board.participants.addAll(listOf(sender, receiver))

        every { boardRepository.findBySlug("test-slug") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test-slug", SendKudosRequest("sender-1", "receiver-1", "INVALID"))
        }
    }

    @Test
    fun `全フェーズでKudos送信可能`() {
        Phase.entries.forEach { phase ->
            clearAllMocks()

            val board = TestFixtures.board(phase = phase)
            val sender = TestFixtures.participant(id = "sender-1", nickname = "Alice", board = board)
            val receiver = TestFixtures.participant(id = "receiver-1", nickname = "Bob", isFacilitator = false, board = board)
            board.participants.addAll(listOf(sender, receiver))

            every { boardRepository.findBySlug("test-slug") } returns board
            every { kudosRepository.save(any()) } answers { firstArg() }

            val response = useCase.execute("test-slug", SendKudosRequest("sender-1", "receiver-1", "THANK_YOU"))
            assertEquals("THANK_YOU", response.category)
        }
    }
}
