package com.retra.board.domain

import com.retra.TestFixtures
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.InvalidPhaseTransitionException
import com.retra.shared.domain.NotFoundException
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class BoardTest {

    @Test
    fun `create でフレームワークに応じたカラムが生成される`() {
        val board = Board.create("Test", Framework.KPT)
        assertEquals(3, board.columns.size)
        assertEquals("Keep", board.columns[0].name)
        assertEquals(8, board.slug.length)
        assertEquals(Phase.WRITING, board.phase)
        assertTrue(board.getDomainEvents().isNotEmpty())
    }

    @Test
    fun `transitionPhase でファシリテーターがフェーズ遷移`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)

        board.transitionPhase(Phase.VOTING, "p-1")

        assertEquals(Phase.VOTING, board.phase)
        assertTrue(board.getDomainEvents().isNotEmpty())
    }

    @Test
    fun `transitionPhase で非ファシリテーターは ForbiddenException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val member = TestFixtures.participant(id = "p-2", board = board, isFacilitator = false)
        board.participants.add(member)

        assertFailsWith<ForbiddenException> {
            board.transitionPhase(Phase.VOTING, "p-2")
        }
    }

    @Test
    fun `transitionPhase で無効な遷移は InvalidPhaseTransitionException`() {
        val board = TestFixtures.board(phase = Phase.WRITING)
        val facilitator = TestFixtures.participant(id = "p-1", board = board, isFacilitator = true)
        board.participants.add(facilitator)

        assertFailsWith<InvalidPhaseTransitionException> {
            board.transitionPhase(Phase.DISCUSSION, "p-1")
        }
    }

    @Test
    fun `addParticipant で最初の参加者はファシリテーター`() {
        val board = TestFixtures.board()
        val p = board.addParticipant("Alice")
        assertTrue(p.isFacilitator)
        assertTrue(p.isOnline)
    }

    @Test
    fun `addParticipant で2人目は非ファシリテーター`() {
        val board = TestFixtures.board()
        board.addParticipant("Alice")
        val p2 = board.addParticipant("Bob")
        assertFalse(p2.isFacilitator)
    }

    @Test
    fun `findParticipantById で存在しない参加者は NotFoundException`() {
        val board = TestFixtures.board()
        assertFailsWith<NotFoundException> {
            board.findParticipantById("unknown")
        }
    }

    @Test
    fun `findColumnById で存在しないカラムは NotFoundException`() {
        val board = TestFixtures.board()
        assertFailsWith<NotFoundException> {
            board.findColumnById("unknown")
        }
    }
}
