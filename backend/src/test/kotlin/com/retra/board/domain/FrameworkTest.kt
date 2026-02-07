package com.retra.board.domain

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class FrameworkTest {

    @Test
    fun `KPT は Keep, Problem, Try の3カラム`() {
        val defs = Framework.KPT.getColumnDefinitions()
        assertEquals(3, defs.size)
        assertEquals("Keep", defs[0].name)
        assertEquals("Problem", defs[1].name)
        assertEquals("Try", defs[2].name)
    }

    @Test
    fun `FUN_DONE_LEARN は Fun, Done, Learn の3カラム`() {
        val defs = Framework.FUN_DONE_LEARN.getColumnDefinitions()
        assertEquals(3, defs.size)
        assertEquals("Fun", defs[0].name)
        assertEquals("Done", defs[1].name)
        assertEquals("Learn", defs[2].name)
    }

    @Test
    fun `FOUR_LS は 4カラム`() {
        val defs = Framework.FOUR_LS.getColumnDefinitions()
        assertEquals(4, defs.size)
        assertEquals("Liked", defs[0].name)
        assertEquals("Learned", defs[1].name)
        assertEquals("Lacked", defs[2].name)
        assertEquals("Longed For", defs[3].name)
    }

    @Test
    fun `START_STOP_CONTINUE は 3カラム`() {
        val defs = Framework.START_STOP_CONTINUE.getColumnDefinitions()
        assertEquals(3, defs.size)
        assertEquals("Start", defs[0].name)
        assertEquals("Stop", defs[1].name)
        assertEquals("Continue", defs[2].name)
    }
}
