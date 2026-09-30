package com.skillbridge.model.money;

/**
 * PAID is reachable only from the signed webhook (or reconciliation asking the gateway
 * directly). Nothing the browser sends can set it - which is the whole point of the column.
 */
public enum PaymentOrderStatus { CREATED, ATTEMPTED, PAID, FAILED, ABANDONED }
