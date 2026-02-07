package com.retra.card.gateway.db

import com.retra.card.domain.Memo
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataMemoRepository : JpaRepository<Memo, String>
