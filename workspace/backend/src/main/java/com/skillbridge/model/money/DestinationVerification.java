package com.skillbridge.model.money;

/**
 * Veyora 023 split one "verified" boolean into named states, because a payout method in
 * India can be true in several different ways at several different costs. NAME_MISMATCH is
 * kept distinct from FAILED: the penny-drop succeeded, the bank answered, and the name it
 * answered with is not the worker's. That is a thing to show, not to swallow.
 */
public enum DestinationVerification { UNVERIFIED, PENDING, VERIFIED, FAILED, NAME_MISMATCH }
