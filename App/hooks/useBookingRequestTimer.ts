import { useEffect, useRef, useState } from 'react';

const REQUEST_EXPIRATION_SECONDS = 300; // 5 minutos

export const useBookingRequestTimer = ({
  expiresAt,
  createdAt,
  expiresInSeconds = REQUEST_EXPIRATION_SECONDS,
  onExpired,
}: {
  expiresAt?: string | null;   // request_expires_at del booking (preferido)
  createdAt?: string | null;   // fallback: se suma expiresInSeconds
  expiresInSeconds?: number;
  onExpired?: () => void;
}) => {
  const [timeRemaining, setTimeRemaining] = useState(expiresInSeconds);
  const hasCalledExpiredRef = useRef(false);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  // Calcula el timestamp de expiración: usa expiresAt directo o lo computa de createdAt
  const resolvedExpiresAt = expiresAt
    ? new Date(expiresAt).getTime()
    : createdAt
    ? new Date(createdAt).getTime() + expiresInSeconds * 1000
    : null;

  useEffect(() => {
    if (!resolvedExpiresAt) return;

    hasCalledExpiredRef.current = false;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((resolvedExpiresAt - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0 && !hasCalledExpiredRef.current) {
        hasCalledExpiredRef.current = true;
        onExpiredRef.current?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [resolvedExpiresAt]);

  const formatTime = (secs = timeRemaining) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isExpired = timeRemaining === 0 && resolvedExpiresAt !== null;

  return { timeRemaining, isExpired, formatTime };
};
