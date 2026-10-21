package com.skillbridge.exception;

/**
 * The job does not have the money behind it for this hire yet.
 *
 * Its own type so a worker accepting an offer can be told plainly and the
 * shop owner's "add money" nudge still commits, instead of rolling back with
 * the failed acceptance.
 */
public class FundsNeededException extends ApiException {
    public FundsNeededException(String message) {
        super(400, message);
    }
}
