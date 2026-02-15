package com.retra.actionitem.gateway.controller

import com.retra.actionitem.usecase.CarryOverItemsResponse
import com.retra.actionitem.usecase.GetCarryOverItemsUseCase
import com.retra.actionitem.usecase.UpdateActionItemStatusRequest
import com.retra.actionitem.usecase.UpdateCarryOverItemStatusUseCase
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/carry-over-items")
class CarryOverController(
    private val getCarryOverItemsUseCase: GetCarryOverItemsUseCase,
    private val updateCarryOverItemStatusUseCase: UpdateCarryOverItemStatusUseCase
) {

    @GetMapping
    fun getCarryOverItems(@PathVariable slug: String): CarryOverItemsResponse {
        return getCarryOverItemsUseCase.execute(slug)
    }

    @PatchMapping("/{actionItemId}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun updateCarryOverItemStatus(
        @PathVariable slug: String,
        @PathVariable actionItemId: String,
        @Valid @RequestBody request: UpdateActionItemStatusRequest
    ) {
        updateCarryOverItemStatusUseCase.execute(slug, actionItemId, request)
    }
}
