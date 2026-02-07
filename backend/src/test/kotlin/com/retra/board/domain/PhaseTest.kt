package com.retra.board.domain

import com.retra.shared.domain.InvalidPhaseTransitionException
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PhaseTest {

    @Test
    fun `WRITING から VOTING への遷移が可能`() {
        assertTrue(Phase.WRITING.canTransitionTo(Phase.VOTING))
    }

    @Test
    fun `VOTING から DISCUSSION への遷移が可能`() {
        assertTrue(Phase.VOTING.canTransitionTo(Phase.DISCUSSION))
    }

    @Test
    fun `DISCUSSION から ACTION_ITEMS への遷移が可能`() {
        assertTrue(Phase.DISCUSSION.canTransitionTo(Phase.ACTION_ITEMS))
    }

    @Test
    fun `ACTION_ITEMS から CLOSED への遷移が可能`() {
        assertTrue(Phase.ACTION_ITEMS.canTransitionTo(Phase.CLOSED))
    }

    @Test
    fun `WRITING から DISCUSSION への直接遷移は不可`() {
        assertFalse(Phase.WRITING.canTransitionTo(Phase.DISCUSSION))
    }

    @Test
    fun `transitionTo は有効な遷移で新しいPhaseを返す`() {
        val result = Phase.WRITING.transitionTo(Phase.VOTING)
        assertEquals(Phase.VOTING, result)
    }

    @Test
    fun `transitionTo は無効な遷移で例外`() {
        assertFailsWith<InvalidPhaseTransitionException> {
            Phase.WRITING.transitionTo(Phase.DISCUSSION)
        }
    }

    @Test
    fun `canCreateCard は WRITING のみ true`() {
        assertTrue(Phase.WRITING.canCreateCard())
        assertFalse(Phase.VOTING.canCreateCard())
        assertFalse(Phase.DISCUSSION.canCreateCard())
    }

    @Test
    fun `canVote は VOTING のみ true`() {
        assertTrue(Phase.VOTING.canVote())
        assertFalse(Phase.WRITING.canVote())
        assertFalse(Phase.DISCUSSION.canVote())
    }

    @Test
    fun `canMoveCard は WRITING, DISCUSSION, ACTION_ITEMS で true`() {
        assertTrue(Phase.WRITING.canMoveCard())
        assertFalse(Phase.VOTING.canMoveCard())
        assertTrue(Phase.DISCUSSION.canMoveCard())
        assertTrue(Phase.ACTION_ITEMS.canMoveCard())
        assertFalse(Phase.CLOSED.canMoveCard())
    }

    @Test
    fun `canCreateMemo は DISCUSSION と ACTION_ITEMS で true`() {
        assertFalse(Phase.WRITING.canCreateMemo())
        assertFalse(Phase.VOTING.canCreateMemo())
        assertTrue(Phase.DISCUSSION.canCreateMemo())
        assertTrue(Phase.ACTION_ITEMS.canCreateMemo())
        assertFalse(Phase.CLOSED.canCreateMemo())
    }
}
