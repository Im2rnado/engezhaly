import { api } from '@/lib/api';

/** Body for POST /payment-methods/init-charge (spread into initCharge). */
export type InitChargeBody = {
    type: string;
    amountCents: number;
    callbackSuccessUrl?: string;
    [key: string]: unknown;
};

/**
 * If wallet balance covers the amount, calls initCharge (server deducts wallet and fulfills).
 * Returns true if paid from wallet; false if caller should show card/InstaPay UI.
 */
export async function payWithWalletIfPossible(
    body: InitChargeBody,
    onPaidFromWallet: (result: { paidFromWallet?: boolean; remainingBalance?: number }) => void
): Promise<boolean> {
    const needEgp = body.amountCents / 100;
    const { balance } = await api.wallet.getBalance();
    if (balance == null || balance < needEgp) {
        return false;
    }
    const result = await api.paymentMethods.initCharge(
        body as { type: string; amountCents: number; callbackSuccessUrl?: string; [k: string]: any }
    );
    if (result?.paidFromWallet) {
        onPaidFromWallet(result);
        return true;
    }
    return false;
}
