/**
 * @deprecated El tracking GPS del conductor ahora se maneja globalmente desde
 * `useGlobalDriverTracking` montado en `app/_layout.tsx`. Este hook se mantiene
 * vacío para no romper imports existentes en pantallas que aún lo invocan.
 * No agregar lógica aquí: cualquier start/stop debe hacerse en
 * `common/services/driverLocationTask.ts`.
 */
export function useDriverTracking(
  _bookingId: string | null | undefined,
  _driverId: string | null | undefined,
  _isActive: boolean,
) {
  // intencionalmente vacío
}
