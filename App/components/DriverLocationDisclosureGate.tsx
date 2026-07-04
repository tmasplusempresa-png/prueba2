import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import LocationDisclosureModal from './LocationDisclosureModal';
import {
  getBackgroundLocationConsent,
  setBackgroundLocationConsent,
  subscribeDisclosureRequest,
} from '@/common/services/backgroundLocationConsent';
import { requestBackgroundLocationPermission } from '@/common/services/driverLocationTask';

function pickUserType(user: any, profile: any): string {
  return String(
    profile?.user_type ||
      user?.usertype ||
      user?.user_type ||
      user?.userType ||
      user?.user_metadata?.usertype ||
      user?.user_metadata?.user_type ||
      user?.user_metadata?.userType ||
      '',
  )
    .trim()
    .toLowerCase();
}

/**
 * Muestra la Prominent Disclosure de ubicación en segundo plano a los
 * conductores (la única clase de usuario que necesita el permiso) y solo
 * solicita el permiso del sistema si el conductor acepta.
 *
 * Comportamiento:
 *  - Conductor nuevo (sin decisión guardada): se muestra al iniciar sesión.
 *  - Si aceptó: no se vuelve a mostrar (consentimiento guardado por usuario).
 *  - Si tocó "Ahora no": no queda bloqueado para siempre; se le vuelve a
 *    preguntar cuando el permiso se necesita de verdad (un viaje activo),
 *    como máximo una vez por sesión para no resultar molesto.
 *
 * Se monta de forma global (dentro del Provider de Redux) para que el modal
 * aparezca por encima de cualquier pantalla.
 */
export default function DriverLocationDisclosureGate() {
  const user = useSelector((s: any) => s.auth?.user);
  const profile = useSelector((s: any) => s.auth?.profile);
  const isDriver = pickUserType(user, profile) === 'driver';
  const userId: string | null = user?.id ?? null;

  const [visible, setVisible] = useState(false);
  // Evita volver a mostrar el modal repetidamente dentro de la misma sesión.
  const handledThisSession = useRef(false);

  // Restablece el control por sesión cuando cambia el usuario (nuevo login).
  useEffect(() => {
    handledThisSession.current = false;
  }, [userId]);

  // Primera vez: conductor sin decisión guardada -> mostrar al iniciar sesión.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!isDriver || !userId) {
        if (active) setVisible(false);
        return;
      }
      const consent = await getBackgroundLocationConsent(userId);
      if (active && consent === null) {
        handledThisSession.current = true;
        setVisible(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [isDriver, userId]);

  // Re-preguntar cuando un viaje activo necesita el permiso y aún no se concedió.
  useEffect(() => {
    if (!isDriver || !userId) return;
    const unsubscribe = subscribeDisclosureRequest(async () => {
      if (handledThisSession.current) return;
      const consent = await getBackgroundLocationConsent(userId);
      if (consent !== 'granted') {
        handledThisSession.current = true;
        setVisible(true);
      }
    });
    return unsubscribe;
  }, [isDriver, userId]);

  const handleAccept = async () => {
    setVisible(false);
    handledThisSession.current = true;
    await setBackgroundLocationConsent(userId, 'granted');
    // El cuadro del sistema aparece inmediatamente DESPUÉS de la divulgación.
    await requestBackgroundLocationPermission();
  };

  const handleDecline = async () => {
    setVisible(false);
    handledThisSession.current = true;
    await setBackgroundLocationConsent(userId, 'denied');
  };

  return (
    <LocationDisclosureModal
      visible={visible}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  );
}
