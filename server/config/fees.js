/**
 * Platform fees (EGP). Paused at 0 — restore by setting values back to 20 where noted below.
 *
 * Previous values:
 *   CLIENT_PLATFORM_FEE_EGP = 20        — client-side payment surcharge (when used)
 *   ORDER_PLATFORM_FEE_EGP = 20         — stored on Order.platformFee; deducted from freelancer on payout
 *   WITHDRAWAL_FEE_EGP = 20               — per withdrawal request
 *   WALLET_TOPUP_FEE_EGP = 20             — deducted from card top-up before crediting wallet
 */
module.exports = {
    CLIENT_PLATFORM_FEE_EGP: 0,
    ORDER_PLATFORM_FEE_EGP: 0,
    WITHDRAWAL_FEE_EGP: 0,
    WALLET_TOPUP_FEE_EGP: 0
};
