import { useEffect, useState } from 'react';
import { BookingCompany, fetchBookingCompany } from '@/common/services/companiesService';

/** Empresa a la que se factura el viaje; null si no es empresarial o aún no carga. */
export function useBookingCompany(bookingId: string | null | undefined, enabled: boolean): BookingCompany | null {
  const [company, setCompany] = useState<BookingCompany | null>(null);

  useEffect(() => {
    if (!enabled || !bookingId) {
      setCompany(null);
      return;
    }
    const controller = new AbortController();
    fetchBookingCompany(String(bookingId), controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCompany(result);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [bookingId, enabled]);

  return company;
}
