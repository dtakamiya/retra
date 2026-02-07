package com.retra.board.usecase

import com.retra.TestFixtures
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.InvalidPhaseTransitionException
import com.retra.shared.domain.NotFoundException
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class TransitionPhaseUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: TransitionPhaseUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = TransitionPhaseUseCase(boardRepository, eventPublisher)
    }

    @Test
    fun `WRITING から VOTING への遷移成功`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board
        every { boardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute("test1234", ChangePhaseRequest(Phase.VOTING, "p-1"))

        assertEquals(Phase.VOTING, response.phase)
    }

    @Test
    fun `無効な遷移で InvalidPhaseTransitionException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<InvalidPhaseTransitionException> {
            useCase.execute("test1234", ChangePhaseRequest(Phase.DISCUSSION, "p-1"))
        }
    }

    @Test
    fun `非ファシリテーターで ForbiddenException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val member = TestFixtures.participant(id = "p-2", board = board, isFacilitator = false)
        board.participants.add(member)
        every { boardRepository.findBySlug(any()) } returns board

        assertFailsWith<ForbiddenException> {
            useCase.execute("test1234", ChangePhaseRequest(Phase.VOTING, "p-2"))
        }
    }

    @Test
    fun `存在しないボードで NotFoundException`() {
        every { boardRepository.findBySlug(any()) } returns null

        assertFailsWith<NotFoundException> {
            useCase.execute("unknown", ChangePhaseRequest(Phase.VOTING, "p-1"))
        }
    }
}
