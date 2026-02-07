package com.retra.card.gateway.controller

import com.retra.card.usecase.CreateMemoRequest
import com.retra.card.usecase.CreateMemoUseCase
import com.retra.card.usecase.DeleteMemoRequest
import com.retra.card.usecase.DeleteMemoUseCase
import com.retra.card.usecase.MemoResponse
import com.retra.card.usecase.UpdateMemoRequest
import com.retra.card.usecase.UpdateMemoUseCase
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/cards/{cardId}/memos")
class MemoController(
    private val createMemoUseCase: CreateMemoUseCase,
    private val updateMemoUseCase: UpdateMemoUseCase,
    private val deleteMemoUseCase: DeleteMemoUseCase
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createMemo(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @RequestBody request: CreateMemoRequest
    ): MemoResponse {
        return createMemoUseCase.execute(slug, cardId, request)
    }

    @PutMapping("/{memoId}")
    fun updateMemo(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @PathVariable memoId: String,
        @RequestBody request: UpdateMemoRequest
    ): MemoResponse {
        return updateMemoUseCase.execute(slug, cardId, memoId, request)
    }

    @DeleteMapping("/{memoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteMemo(
        @PathVariable slug: String,
        @PathVariable cardId: String,
        @PathVariable memoId: String,
        @RequestBody request: DeleteMemoRequest
    ) {
        deleteMemoUseCase.execute(slug, cardId, memoId, request)
    }
}
