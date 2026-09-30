package com.skillbridge.service.payment;

import com.skillbridge.model.money.*;
import com.skillbridge.repository.LedgerEntryRepository;
import com.skillbridge.repository.LedgerTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Money is a ledger, not a balance column.
 *
 * {@link #post} is the ONLY way an entry is ever written. It refuses anything that does not
 * balance, and it throws rather than returning an error object: an unbalanced write is a bug
 * in the caller, not something a user did, and the only safe response is to abort the
 * transaction before it reaches the database.
 *
 * Entries are immutable. There is deliberately no update or delete here - a correction is a
 * new, reversing transaction, so the history can be replayed and never quietly rewritten.
 */
@Service
public class LedgerService {

    private final LedgerTransactionRepository transactions;
    private final LedgerEntryRepository entries;

    public LedgerService(LedgerTransactionRepository transactions, LedgerEntryRepository entries) {
        this.transactions = transactions;
        this.entries = entries;
    }

    /** One leg of a transaction. Built by the static helpers below so a direction is never guessed. */
    public record Leg(LedgerAccountType accountType, Long ownerId, LedgerDirection direction,
                      long amountMinor, String currency) {

        public static Leg debit(LedgerAccountType type, Long ownerId, long amountMinor) {
            return new Leg(type, ownerId, LedgerDirection.DEBIT, amountMinor, "INR");
        }

        public static Leg credit(LedgerAccountType type, Long ownerId, long amountMinor) {
            return new Leg(type, ownerId, LedgerDirection.CREDIT, amountMinor, "INR");
        }
    }

    /** Everything a transaction header needs, so callers are not juggling eight positional arguments. */
    public static class Post {
        public String kind;
        public Long jobId;
        public Long employmentId;
        public String memo;
        public String createdByType;
        public Long createdById;
        public String idempotencyKey;
        public final List<Leg> legs = new ArrayList<>();

        public Post(String kind) { this.kind = kind; }
        public Post job(Long id) { this.jobId = id; return this; }
        public Post employment(Long id) { this.employmentId = id; return this; }
        public Post memo(String m) { this.memo = m; return this; }
        public Post by(String type, Long id) { this.createdByType = type; this.createdById = id; return this; }
        public Post idempotent(String key) { this.idempotencyKey = key; return this; }
        public Post leg(Leg leg) { this.legs.add(leg); return this; }
    }

    /**
     * Writes one balanced transaction.
     *
     * Joins the caller's transaction (MANDATORY would be stricter but breaks the standalone
     * seeder); the point is that a ledger post and whatever it records must commit together.
     * A payment marked PAID whose funding rolled back is an employer charged for a job that
     * never got funded.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public LedgerTransaction post(Post post) {
        // Zero-value legs are simply not posted. A fee of zero is not an entry of zero, it is
        // the absence of a fee, and a row of amount 0 would only be noise in the audit trail.
        List<Leg> legs = post.legs.stream().filter(l -> l != null && l.amountMinor() > 0).toList();

        if (legs.isEmpty()) {
            throw new IllegalStateException("Ledger transaction \"" + post.kind + "\" has no entries");
        }

        long debits = legs.stream().filter(l -> l.direction() == LedgerDirection.DEBIT)
                .mapToLong(Leg::amountMinor).sum();
        long credits = legs.stream().filter(l -> l.direction() == LedgerDirection.CREDIT)
                .mapToLong(Leg::amountMinor).sum();
        if (debits != credits) {
            throw new IllegalStateException("Unbalanced ledger transaction \"" + post.kind
                    + "\": debits " + debits + " != credits " + credits);
        }

        // An idempotency key we already hold means this exact movement has been posted. Hand
        // back the original rather than posting a second one - a replayed webhook, a retried
        // release, a reconciliation run racing a delivery all land here.
        if (post.idempotencyKey != null) {
            var existing = transactions.findByIdempotencyKey(post.idempotencyKey);
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        LedgerTransaction txn = transactions.save(LedgerTransaction.builder()
                .kind(post.kind).jobId(post.jobId).employmentId(post.employmentId)
                .memo(post.memo).createdByType(post.createdByType).createdById(post.createdById)
                .idempotencyKey(post.idempotencyKey)
                .build());
        // The reference wants the id, which only exists after the insert.
        txn.setReference(String.format("TXN-%06d", txn.getId()));
        transactions.save(txn);

        for (Leg leg : legs) {
            entries.save(LedgerEntry.builder()
                    .transactionId(txn.getId())
                    .accountType(leg.accountType())
                    .ownerId(leg.ownerId())
                    .direction(leg.direction())
                    .amountMinor(leg.amountMinor())
                    .currency(leg.currency() == null ? "INR" : leg.currency())
                    .build());
        }
        return txn;
    }

    // ------------------------------------------------------------------ derived balances

    /** Credits minus debits for one owner of one account type. Never stored, always computed. */
    public long balanceMinor(LedgerAccountType type, Long ownerId) {
        Long v = ownerId == null ? entries.balanceUnowned(type) : entries.balanceOwned(type, ownerId);
        return v == null ? 0L : v;
    }

    /** Every owner of one account type together. */
    public long totalMinor(LedgerAccountType type) {
        Long v = entries.totalMinor(type);
        return v == null ? 0L : v;
    }

    /** Across the whole chart of accounts. Must be zero. */
    public long grandTotalMinor() {
        Long v = entries.grandTotalMinor();
        return v == null ? 0L : v;
    }

    public List<LedgerEntry> entriesOf(Long transactionId) {
        return entries.findByTransactionId(transactionId);
    }

    public List<LedgerEntry> entriesOf(List<Long> transactionIds) {
        return transactionIds.isEmpty() ? List.of() : entries.findByTransactionIdIn(transactionIds);
    }
}
