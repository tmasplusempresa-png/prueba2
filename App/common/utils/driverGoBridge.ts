type DriverGoFn = () => void | Promise<void>;

let activateFn: DriverGoFn | null = null;
let deactivateFn: DriverGoFn | null = null;

/** HomeScreen registers activate/deactivate so nav and cards can invoke GO safely. */
export function registerDriverGoHandlers(handlers: {
  activate: DriverGoFn;
  deactivate: DriverGoFn;
}) {
  activateFn = handlers.activate;
  deactivateFn = handlers.deactivate;
  return () => {
    if (activateFn === handlers.activate) activateFn = null;
    if (deactivateFn === handlers.deactivate) deactivateFn = null;
  };
}

/** Activates GO (navbar, offline GO buttons). Does nothing if already online. */
export function invokeDriverGoActivate() {
  void activateFn?.();
}

/** Deactivates GO (disconnect switch on map card). Does nothing if already offline. */
export function invokeDriverGoDeactivate() {
  void deactivateFn?.();
}

/** @deprecated Use invokeDriverGoActivate — kept for any legacy callers. */
export function invokeDriverGoToggle() {
  invokeDriverGoActivate();
}
