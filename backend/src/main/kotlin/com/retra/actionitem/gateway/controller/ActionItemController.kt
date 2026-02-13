package com.retra.actionitem.gateway.controller

import com.retra.actionitem.usecase.ActionItemResponse
import com.retra.actionitem.usecase.CreateActionItemRequest
import com.retra.actionitem.usecase.CreateActionItemUseCase
import com.retra.actionitem.usecase.DeleteActionItemRequest
import com.retra.actionitem.usecase.DeleteActionItemUseCase
import com.retra.actionitem.usecase.GetActionItemsUseCase
import com.retra.actionitem.usecase.UpdateActionItemRequest
import com.retra.actionitem.usecase.UpdateActionItemStatusRequest
import com.retra.actionitem.usecase.UpdateActionItemStatusUseCase
import com.retra.actionitem.usecase.UpdateActionItemUseCase
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/action-items")
class ActionItemController(
    private val createUseCase: CreateActionItemUseCase,
    private val updateUseCase: UpdateActionItemUseCase,
    private val updateStatusUseCase: UpdateActionItemStatusUseCase,
    private val deleteUseCase: DeleteActionItemUseCase,
    private val getUseCase: GetActionItemsUseCase
) {

    @GetMapping
    fun getActionItems(@PathVariable slug: String): List<ActionItemResponse> {
        return getUseCase.execute(slug)
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createActionItem(
        @PathVariable slug: String,
        @RequestBody request: CreateActionItemRequest
    ): ActionItemResponse {
        return createUseCase.execute(slug, request)
    }

    @PutMapping("/{id}")
    fun updateActionItem(
        @PathVariable slug: String,
        @PathVariable id: String,
        @RequestBody request: UpdateActionItemRequest
    ): ActionItemResponse {
        return updateUseCase.execute(slug, id, request)
    }

    @PatchMapping("/{id}/status")
    fun updateStatus(
        @PathVariable slug: String,
        @PathVariable id: String,
        @RequestBody request: UpdateActionItemStatusRequest
    ): ActionItemResponse {
        return updateStatusUseCase.execute(slug, id, request)
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteActionItem(
        @PathVariable slug: String,
        @PathVariable id: String,
        @RequestBody request: DeleteActionItemRequest
    ) {
        deleteUseCase.execute(slug, id, request)
    }
}
