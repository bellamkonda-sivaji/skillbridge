package com.skillbridge.security;

import com.skillbridge.model.AccountType;

/**
 * Keeping the two sides of a job from phoning each other directly.
 *
 * A worker and an employer who exchange numbers can agree the next job
 * privately, and the one with less power in that conversation is always the
 * worker: no record of the shift, no confirmed day, nobody to call when the
 * money does not come. The platform exists to stand between them, and it
 * cannot do that if the first screen hands over a phone number.
 *
 * So a contact detail is returned only to the person it belongs to, and to
 * staff. Everyone else gets null, and the apps offer "ask us to arrange a
 * call" instead - which also gives the office a record that the two of them
 * are talking.
 *
 * Enforced at serialisation because that is the only place it holds for every
 * endpoint at once. Blanking it in each screen leaves it on the wire, where a
 * modified app or anyone watching the network still reads it.
 */
public final class Privacy {

    private Privacy() {}

    /**
     * @param ownerType whose detail this is
     * @param ownerId   their account id
     * @return the value for its owner and for admins, null for anyone else
     */
    public static String contactFor(String value, AccountType ownerType, Long ownerId) {
        if (value == null || value.isBlank()) return null;
        AccountType who;
        Long id;
        try {
            who = AuthenticationUtils.currentType();
            id = AuthenticationUtils.currentId();
        } catch (RuntimeException e) {
            // No principal: seeding, scheduled work, or an unauthenticated
            // request. None of them should be handed a phone number.
            return null;
        }
        if (who == AccountType.ADMIN) return value;
        if (who == ownerType && ownerId != null && ownerId.equals(id)) return value;
        return null;
    }

    /** True when the caller is staff, for fields only the office should see. */
    public static boolean isStaff() {
        try {
            return AuthenticationUtils.currentType() == AccountType.ADMIN;
        } catch (RuntimeException e) {
            return false;
        }
    }
}
