import { useEffect, useState, useCallback, useRef } from 'react';
import supabase from '@/config/SupabaseConfig';

interface UseOtpTimerProps {
  bookingId: string;
  initialTimeRemaining?: number;
  onTimerExpired?: () => void;
  autoStart?: boolean;
}

interface OtpTimerState {
  timeRemaining: number;
  isRunning: boolean;
  isExpired: boolean;
  hasStarted: boolean;
  timerStartedAt: string | null;
}

/** Duración fija del countdown OTP (3 min). No hay columna otp_timer_duration. */
const OTP_WAIT_SECONDS = 180;

/**
 * Countdown de espera OTP en el punto de recogida.
 *
 * aplicacioncore / vista `bookings` NO tiene:
 *   - otp_timer_started_at
 *   - otp_timer_duration
 *
 * Se usa `driver_arrived_time` (sí existe) como marca de inicio en BD,
 * y el estado del countdown se maneja en memoria en el cliente.
 */
export const useOtpTimer = ({
  bookingId,
  initialTimeRemaining = OTP_WAIT_SECONDS,
  onTimerExpired,
  autoStart = true,
}: UseOtpTimerProps) => {
  const [timerState, setTimerState] = useState<OtpTimerState>({
    timeRemaining: initialTimeRemaining,
    isRunning: false,
    isExpired: false,
    hasStarted: false,
    timerStartedAt: null,
  });

  const onTimerExpiredRef = useRef(onTimerExpired);
  const hasCalledExpiredRef = useRef(false);
  /** Inicio local (ms) — prioriza sobre BD si el conductor acaba de confirmar llegada. */
  const localStartedAtRef = useRef<number | null>(null);

  const applyFromStartMs = useCallback((startMs: number, startedAtIso: string) => {
    const now = Date.now();
    const elapsed = (now - startMs) / 1000;
    const remaining = Math.min(
      OTP_WAIT_SECONDS,
      Math.max(0, OTP_WAIT_SECONDS - elapsed),
    );
    const isExpired = remaining <= 0;

    setTimerState({
      hasStarted: true,
      isRunning: !isExpired,
      timeRemaining: Math.ceil(remaining),
      isExpired,
      timerStartedAt: startedAtIso,
    });

    if (isExpired && !hasCalledExpiredRef.current && onTimerExpiredRef.current) {
      console.log('⏰ [TIMER EXPIRED] Calling callback');
      hasCalledExpiredRef.current = true;
      onTimerExpiredRef.current();
    }

    return remaining;
  }, []);

  const fetchTimerState = useCallback(async () => {
    try {
      // Preferir inicio local (tras confirmar llegada en este dispositivo)
      if (localStartedAtRef.current != null) {
        return applyFromStartMs(
          localStartedAtRef.current,
          new Date(localStartedAtRef.current).toISOString(),
        );
      }

      // Sync desde BD: driver_arrived_time (columna real en bookings)
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select('driver_arrived_time, otp_verified, status')
        .eq('id', bookingId)
        .single();

      if (error || !data) return null;

      const arrivedAt = data.driver_arrived_time as string | null;
      const verified = Boolean(data.otp_verified);
      const status = String(data.status || '').toUpperCase();

      // Si ya verificó OTP o el viaje avanzó, no hay countdown activo
      if (verified || status === 'STARTED' || status === 'COMPLETE' || status === 'PAID') {
        setTimerState((prev) => ({
          ...prev,
          hasStarted: false,
          isRunning: false,
          isExpired: false,
          timeRemaining: initialTimeRemaining,
          timerStartedAt: null,
        }));
        return null;
      }

      if (!arrivedAt || (status !== 'ARRIVED' && status !== 'ACCEPTED')) {
        setTimerState((prev) => ({
          ...prev,
          hasStarted: false,
          isRunning: false,
          timeRemaining: initialTimeRemaining,
          timerStartedAt: null,
        }));
        hasCalledExpiredRef.current = false;
        return null;
      }

      // Solo arrancar desde BD si status es ARRIVED (conductor confirmó llegada)
      if (status !== 'ARRIVED') {
        return null;
      }

      const startMs = new Date(arrivedAt).getTime();
      if (!Number.isFinite(startMs)) return null;
      return applyFromStartMs(startMs, arrivedAt);
    } catch (error) {
      console.error('❌ Error in fetchTimerState:', error);
      return null;
    }
  }, [bookingId, initialTimeRemaining, applyFromStartMs]);

  useEffect(() => {
    onTimerExpiredRef.current = onTimerExpired;
  }, [onTimerExpired]);

  useEffect(() => {
    if (!bookingId) return;

    fetchTimerState();
    const interval = setInterval(fetchTimerState, 1000);

    return () => clearInterval(interval);
  }, [bookingId, fetchTimerState]);

  /** Inicia countdown local. La marca en BD es driver_arrived_time (ya escrita al confirmar llegada). */
  const startTimer = useCallback(async (startedAtMs?: number) => {
    try {
      const ms = startedAtMs ?? Date.now();
      localStartedAtRef.current = ms;
      hasCalledExpiredRef.current = false;
      applyFromStartMs(ms, new Date(ms).toISOString());
      console.log('✅ Timer started (local) for booking:', bookingId);
      return true;
    } catch (error) {
      console.error('❌ Failed to start timer:', error);
      return false;
    }
  }, [bookingId, applyFromStartMs]);

  /** Limpia countdown local tras verificar OTP. No escribe columnas inexistentes. */
  const resetTimer = useCallback(async () => {
    try {
      localStartedAtRef.current = null;
      hasCalledExpiredRef.current = false;
      setTimerState({
        timeRemaining: initialTimeRemaining,
        isRunning: false,
        isExpired: false,
        hasStarted: false,
        timerStartedAt: null,
      });
      console.log('✅ Timer reset (local)');
      return true;
    } catch (error) {
      console.error('❌ Failed to reset timer:', error);
      return false;
    }
  }, [initialTimeRemaining]);

  const formatTime = (seconds: number = timerState.timeRemaining): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining: timerState.timeRemaining,
    isRunning: timerState.isRunning,
    isExpired: timerState.isExpired,
    hasStarted: timerState.hasStarted,
    timerStartedAt: timerState.timerStartedAt,
    startTimer,
    resetTimer,
    fetchTimerState,
    formatTime,
  };
};

export type UseOtpTimerReturn = ReturnType<typeof useOtpTimer>;
