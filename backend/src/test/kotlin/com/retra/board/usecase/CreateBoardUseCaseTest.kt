package com.retra.board.usecase

import com.retra.board.domain.Board
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Framework
import com.retra.board.domain.Phase
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class CreateBoardUseCaseTest {

    private val boardRepository: BoardRepository = mockk()
    private val eventPublisher: SpringDomainEventPublisher = mockk(relaxed = true)
    private lateinit var useCase: CreateBoardUseCase

    @BeforeEach
    fun setUp() {
        clearAllMocks()
        useCase = CreateBoardUseCase(boardRepository, eventPublisher)
    }

    @Test
    fun `KPTフレームワークでボード作成`() {
        every { boardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(CreateBoardRequest("My Retro", Framework.KPT, 5))

        assertEquals("My Retro", response.title)
        assertEquals(Framework.KPT, response.framework)
        assertEquals(Phase.WRITING, response.phase)
        assertEquals(3, response.columns.size)
        assertEquals("Keep", response.columns[0].name)
        assertEquals("Problem", response.columns[1].name)
        assertEquals("Try", response.columns[2].name)
        verify { boardRepository.save(any<Board>()) }
        verify { eventPublisher.publishAll(any()) }
    }

    @Test
    fun `スラッグは8文字`() {
        every { boardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(CreateBoardRequest("Retro"))

        assertEquals(8, response.slug.length)
    }

    @Test
    fun `プライベート記述モードでボード作成`() {
        every { boardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(
            CreateBoardRequest("Private Retro", Framework.KPT, 5, isAnonymous = false, privateWriting = true)
        )

        assertEquals(true, response.privateWriting)
    }

    @Test
    fun `プライベート記述モードOFFでボード作成するとfalse`() {
        every { boardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(
            CreateBoardRequest("Normal Retro", Framework.KPT, 5, isAnonymous = false, privateWriting = false)
        )

        assertEquals(false, response.privateWriting)
    }

    @Test
    fun `アイスブレイカー有効でボード作成するとICEBREAKフェーズから開始`() {
        every { boardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(
            CreateBoardRequest("Icebreaker Retro", Framework.KPT, enableIcebreaker = true)
        )

        assertEquals(Phase.ICEBREAK, response.phase)
        assertEquals(true, response.enableIcebreaker)
    }

    @Test
    fun `アイスブレイカー無効でボード作成するとWRITINGフェーズから開始`() {
        every { boardRepository.save(any()) } answers { firstArg() }

        val response = useCase.execute(
            CreateBoardRequest("Normal Retro", Framework.KPT, enableIcebreaker = false)
        )

        assertEquals(Phase.WRITING, response.phase)
        assertEquals(false, response.enableIcebreaker)
    }
}
