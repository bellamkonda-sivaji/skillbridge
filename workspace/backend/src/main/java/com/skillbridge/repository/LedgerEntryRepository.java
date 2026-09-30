package com.skillbridge.repository;

import com.skillbridge.model.money.LedgerAccountType;
import com.skillbridge.model.money.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * A balance is derived here, never stored. Credits minus debits over the immutable entries,
 * recomputed every time it is asked for - so there is no cached number that can drift away
 * from what the books actually say.
 */
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

    String SIGNED = "coalesce(sum(case when e.direction = com.skillbridge.model.money.LedgerDirection.CREDIT "
            + "then e.amountMinor else -e.amountMinor end), 0)";

    List<LedgerEntry> findByTransactionId(Long transactionId);

    List<LedgerEntry> findByTransactionIdIn(List<Long> transactionIds);

    @Query("select " + SIGNED + " from LedgerEntry e where e.accountType = :accountType and e.ownerId = :ownerId")
    Long balanceOwned(@Param("accountType") LedgerAccountType accountType, @Param("ownerId") Long ownerId);

    /** Platform-level accounts (PLATFORM_REVENUE, EXTERNAL_SETTLEMENT...) carry no owner. */
    @Query("select " + SIGNED + " from LedgerEntry e where e.accountType = :accountType and e.ownerId is null")
    Long balanceUnowned(@Param("accountType") LedgerAccountType accountType);

    /** Every owner of one account type together. */
    @Query("select " + SIGNED + " from LedgerEntry e where e.accountType = :accountType")
    Long totalMinor(@Param("accountType") LedgerAccountType accountType);

    /** Across the whole chart of accounts. Always zero; if it is not, something wrote badly. */
    @Query("select " + SIGNED + " from LedgerEntry e")
    Long grandTotalMinor();

    List<LedgerEntry> findByAccountTypeAndOwnerId(LedgerAccountType accountType, Long ownerId);
}
