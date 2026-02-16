package com.retra.kudos.domain

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertAll
import kotlin.test.assertEquals

class KudosCategoryTest {

    @Test
    fun `全カテゴリが6種類存在する`() {
        assertEquals(6, KudosCategory.entries.size)
    }

    @Test
    fun `文字列からカテゴリに変換できる`() {
        assertAll(
            { assertEquals(KudosCategory.GREAT_JOB, KudosCategory.valueOf("GREAT_JOB")) },
            { assertEquals(KudosCategory.THANK_YOU, KudosCategory.valueOf("THANK_YOU")) },
            { assertEquals(KudosCategory.INSPIRING, KudosCategory.valueOf("INSPIRING")) },
            { assertEquals(KudosCategory.HELPFUL, KudosCategory.valueOf("HELPFUL")) },
            { assertEquals(KudosCategory.CREATIVE, KudosCategory.valueOf("CREATIVE")) },
            { assertEquals(KudosCategory.TEAM_PLAYER, KudosCategory.valueOf("TEAM_PLAYER")) }
        )
    }
}
