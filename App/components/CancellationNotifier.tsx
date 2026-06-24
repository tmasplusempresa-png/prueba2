import React, { useCallback, useState } from 'react';
import CustomAlert from '@/components/CustomAlert';
import { useDriverCancellationWatcher } from '@/hooks/useDriverCancellationWatcher';

type CancelPayload = {
  bookingId: string;
  reason: string | null;
  cancelledBy: string | null;
  customerName: string | null;
};

/**
 * Provider montado a nivel raíz autenticado. Escucha cancelaciones de cualquier
 * booking activo del conductor (web admin o cliente) y muestra un modal global,
 * esté el conductor en la pantalla que esté. La pantalla del viaje activo tiene
 * prioridad sobre este watcher (ver activeTripBookings en el hook).
 */
export const CancellationNotifier: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<CancelPayload | null>(null);

  const showCancelModal = useCallback((p: CancelPayload) => {
    setPayload(p);
    setVisible(true);
  }, []);

  useDriverCancellationWatcher(showCancelModal);

  const close = useCallback(() => {
    setVisible(false);
    setPayload(null);
  }, []);

  if (!payload) return null;

  const actor =
    payload.cancelledBy === 'admin'
      ? 'El administrador'
      : payload.customerName || 'El cliente';
  const message = `${actor} canceló el servicio.${
    payload.reason ? `\nMotivo: ${payload.reason}` : ''
  }`;

  return (
    <CustomAlert
      visible={visible}
      type="warning"
      title="Servicio cancelado"
      message={message}
      buttons={[
        {
          text: 'Entendido',
          style: 'default',
          onPress: close,
        },
      ]}
      onDismiss={close}
    />
  );
};

export default CancellationNotifier;
