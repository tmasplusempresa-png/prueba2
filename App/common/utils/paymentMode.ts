/**
 * Fuente única para interpretar `bookings.payment_mode` en la UI.
 *
 * Valores que conviven en la BD:
 *   - "cash" · "nequi" · "daviplata"  (canónicos)
 *   - "transfer"                       (reservas creadas antes de guardar la billetera exacta)
 *   - "Daviplata" / "Nequi" / "wallet" / "card" (flujos legacy)
 *
 * Nunca se cae a "Efectivo" para un valor desconocido: un pago digital mostrado
 * como efectivo hace que el conductor cobre de forma distinta a lo que eligió el cliente.
 */
export type PaymentModeKey = 'cash' | 'nequi' | 'daviplata' | 'transfer' | 'wallet' | 'card' | 'corp';

export const NEQUI_LOGO_URI = 'https://img.logo.dev/nequi.com.co?token=pk_c_F6FSsGSaKey4lkmcDLNw';
export const DAVIPLATA_LOGO_URI = 'https://img.logo.dev/daviplata.com?token=pk_c_F6FSsGSaKey4lkmcDLNw';

const LABELS: Record<PaymentModeKey, string> = {
  cash: 'Efectivo',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transfer: 'Transferencia',
  wallet: 'Billetera',
  card: 'Tarjeta',
  corp: 'Corporativo',
};

export const normalizePaymentMode = (value?: string | null): PaymentModeKey => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === 'cash' || raw === 'efectivo') return 'cash';
  if (raw === 'nequi') return 'nequi';
  if (raw === 'daviplata') return 'daviplata';
  if (raw === 'wallet') return 'wallet';
  if (raw === 'card') return 'card';
  if (raw === 'corp' || raw === 'corporate') return 'corp';
  return 'transfer';
};

export const getPaymentModeLabel = (value?: string | null): string =>
  LABELS[normalizePaymentMode(value)];

export const isCashPayment = (value?: string | null): boolean =>
  normalizePaymentMode(value) === 'cash';

/** Billeteras/transferencias donde el cliente paga al número del conductor. */
export const isTransferPayment = (value?: string | null): boolean => {
  const mode = normalizePaymentMode(value);
  return mode === 'nequi' || mode === 'daviplata' || mode === 'transfer';
};

export const getPaymentModeLogoUri = (value?: string | null): string | null => {
  const mode = normalizePaymentMode(value);
  if (mode === 'nequi') return NEQUI_LOGO_URI;
  if (mode === 'daviplata') return DAVIPLATA_LOGO_URI;
  return null;
};

export const getPaymentModeIonicon = (value?: string | null): string => {
  switch (normalizePaymentMode(value)) {
    case 'cash': return 'cash-outline';
    case 'nequi': return 'phone-portrait-outline';
    case 'card': return 'card-outline';
    case 'transfer': return 'swap-horizontal-outline';
    default: return 'wallet-outline';
  }
};
