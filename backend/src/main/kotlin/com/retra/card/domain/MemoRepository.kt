package com.retra.card.domain

interface MemoRepository {
    fun save(memo: Memo): Memo
    fun findById(id: String): Memo?
    fun delete(memo: Memo)
}
