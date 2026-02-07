package com.retra.card.gateway.db

import com.retra.card.domain.Memo
import com.retra.card.domain.MemoRepository
import org.springframework.stereotype.Repository

@Repository
class JpaMemoRepository(
    private val springDataRepo: SpringDataMemoRepository
) : MemoRepository {

    override fun save(memo: Memo): Memo = springDataRepo.save(memo)

    override fun findById(id: String): Memo? =
        springDataRepo.findById(id).orElse(null)

    override fun delete(memo: Memo) = springDataRepo.delete(memo)
}
