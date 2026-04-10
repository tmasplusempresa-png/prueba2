/**
 * vehicleRules.test.ts
 * ─────────────────────────────────────────────────────────────────
 * Pruebas unitarias para el módulo de reglas de negocio de vehículos.
 *
 * R1 – Crear vehículo es OBLIGATORIO para operar.
 * R2 – Cada conductor puede tener MÁXIMO 2 vehículos.
 * R3 – Cada vehículo puede estar asociado a MÁXIMO 3 conductores.
 * ─────────────────────────────────────────────────────────────────
 */

import {
  VEHICLE_RULES,
  validateDriverHasVehicle,
  validateDriverCanAddVehicle,
  validateVehicleCanAddDriver,
  validateNewVehicleCreation,
  validateNewVehicleCreationAsync,
  validateNewDriverAssignmentAsync,
} from "../utils/vehicleRules";

// ─────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────
describe("VEHICLE_RULES constants", () => {
  it("defines MIN_VEHICLES_PER_DRIVER = 1", () => {
    expect(VEHICLE_RULES.MIN_VEHICLES_PER_DRIVER).toBe(1);
  });

  it("defines MAX_VEHICLES_PER_DRIVER = 2", () => {
    expect(VEHICLE_RULES.MAX_VEHICLES_PER_DRIVER).toBe(2);
  });

  it("defines MAX_DRIVERS_PER_VEHICLE = 3", () => {
    expect(VEHICLE_RULES.MAX_DRIVERS_PER_VEHICLE).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────
// R1 – validateDriverHasVehicle
// ─────────────────────────────────────────────────────────────────
describe("R1 – validateDriverHasVehicle", () => {
  it("falla cuando el conductor no tiene vehículos (count = 0)", () => {
    const result = validateDriverHasVehicle(0);
    expect(result.valid).toBe(false);
    expect(result.code).toBe("VEHICLE_REQUIRED");
    expect(result.message).toBeTruthy();
  });

  it("pasa cuando el conductor tiene 1 vehículo", () => {
    const result = validateDriverHasVehicle(1);
    expect(result.valid).toBe(true);
    expect(result.code).toBe("OK");
  });

  it("pasa cuando el conductor tiene 2 vehículos", () => {
    const result = validateDriverHasVehicle(2);
    expect(result.valid).toBe(true);
    expect(result.code).toBe("OK");
  });

  it("pasa con conteos altos positivos", () => {
    expect(validateDriverHasVehicle(10).valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// R2 – validateDriverCanAddVehicle
// ─────────────────────────────────────────────────────────────────
describe("R2 – validateDriverCanAddVehicle", () => {
  it("pasa cuando el conductor no tiene vehículos aún (count = 0)", () => {
    const result = validateDriverCanAddVehicle(0);
    expect(result.valid).toBe(true);
    expect(result.code).toBe("OK");
  });

  it("pasa cuando el conductor tiene 1 vehículo (puede agregar otro)", () => {
    const result = validateDriverCanAddVehicle(1);
    expect(result.valid).toBe(true);
    expect(result.code).toBe("OK");
  });

  it("falla cuando el conductor ya tiene 2 vehículos (límite exacto)", () => {
    const result = validateDriverCanAddVehicle(2);
    expect(result.valid).toBe(false);
    expect(result.code).toBe("DRIVER_VEHICLE_LIMIT_REACHED");
    expect(result.message).toBeTruthy();
  });

  it("falla cuando el conductor supera el límite (count = 3)", () => {
    const result = validateDriverCanAddVehicle(3);
    expect(result.valid).toBe(false);
    expect(result.code).toBe("DRIVER_VEHICLE_LIMIT_REACHED");
  });

  it("falla con conteos arbitrariamente altos", () => {
    expect(validateDriverCanAddVehicle(99).valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// R3 – validateVehicleCanAddDriver
// ─────────────────────────────────────────────────────────────────
describe("R3 – validateVehicleCanAddDriver", () => {
  it("pasa cuando el vehículo no tiene conductores (count = 0)", () => {
    const result = validateVehicleCanAddDriver(0);
    expect(result.valid).toBe(true);
    expect(result.code).toBe("OK");
  });

  it("pasa cuando el vehículo tiene 1 conductor", () => {
    expect(validateVehicleCanAddDriver(1).valid).toBe(true);
  });

  it("pasa cuando el vehículo tiene 2 conductores", () => {
    expect(validateVehicleCanAddDriver(2).valid).toBe(true);
  });

  it("falla cuando el vehículo ya tiene 3 conductores (límite exacto)", () => {
    const result = validateVehicleCanAddDriver(3);
    expect(result.valid).toBe(false);
    expect(result.code).toBe("VEHICLE_DRIVER_LIMIT_REACHED");
    expect(result.message).toBeTruthy();
  });

  it("falla cuando el vehículo supera el límite (count = 4)", () => {
    expect(validateVehicleCanAddDriver(4).valid).toBe(false);
  });

  it("falla con conteos arbitrariamente altos", () => {
    expect(validateVehicleCanAddDriver(99).valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// validateNewVehicleCreation (función compuesta)
// ─────────────────────────────────────────────────────────────────
describe("validateNewVehicleCreation (compuesta R2)", () => {
  it("permite crear un vehículo con 0 vehículos existentes", () => {
    expect(validateNewVehicleCreation(0).valid).toBe(true);
  });

  it("permite crear un vehículo cuando ya tiene 1", () => {
    expect(validateNewVehicleCreation(1).valid).toBe(true);
  });

  it("bloquea la creación cuando ya tiene 2 vehículos", () => {
    const result = validateNewVehicleCreation(2);
    expect(result.valid).toBe(false);
    expect(result.code).toBe("DRIVER_VEHICLE_LIMIT_REACHED");
  });

  it("bloquea la creación cuando ya tiene 3 o más vehículos", () => {
    expect(validateNewVehicleCreation(3).valid).toBe(false);
    expect(validateNewVehicleCreation(10).valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// validateNewVehicleCreationAsync
// ─────────────────────────────────────────────────────────────────
describe("validateNewVehicleCreationAsync", () => {
  const mockFetcher = (count: number) => (_driverId: string) => Promise.resolve(count);

  it("permite crear cuando el conductor tiene 0 vehículos", async () => {
    const result = await validateNewVehicleCreationAsync("driver-1", mockFetcher(0));
    expect(result.valid).toBe(true);
  });

  it("permite crear cuando el conductor tiene 1 vehículo", async () => {
    const result = await validateNewVehicleCreationAsync("driver-1", mockFetcher(1));
    expect(result.valid).toBe(true);
  });

  it("bloquea cuando el conductor ya tiene 2 vehículos", async () => {
    const result = await validateNewVehicleCreationAsync("driver-1", mockFetcher(2));
    expect(result.valid).toBe(false);
    expect(result.code).toBe("DRIVER_VEHICLE_LIMIT_REACHED");
  });

  it("bloquea cuando el conductor ya tiene 3 vehículos (exceso)", async () => {
    const result = await validateNewVehicleCreationAsync("driver-1", mockFetcher(3));
    expect(result.valid).toBe(false);
  });

  it("pasa el driverId correcto al fetcher", async () => {
    const capturedIds: string[] = [];
    const captureFetcher = async (id: string) => {
      capturedIds.push(id);
      return 0;
    };

    await validateNewVehicleCreationAsync("driver-abc-123", captureFetcher);
    expect(capturedIds).toEqual(["driver-abc-123"]);
  });
});

// ─────────────────────────────────────────────────────────────────
// validateNewDriverAssignmentAsync
// ─────────────────────────────────────────────────────────────────
describe("validateNewDriverAssignmentAsync", () => {
  const mockFetcher = (count: number) => (_vehicleId: string) => Promise.resolve(count);

  it("permite asignar conductor con 0 conductores existentes", async () => {
    const result = await validateNewDriverAssignmentAsync("car-1", mockFetcher(0));
    expect(result.valid).toBe(true);
  });

  it("permite asignar conductor con 1 conductor existente", async () => {
    const result = await validateNewDriverAssignmentAsync("car-1", mockFetcher(1));
    expect(result.valid).toBe(true);
  });

  it("permite asignar conductor con 2 conductores existentes", async () => {
    const result = await validateNewDriverAssignmentAsync("car-1", mockFetcher(2));
    expect(result.valid).toBe(true);
  });

  it("bloquea con 3 conductores (límite exacto)", async () => {
    const result = await validateNewDriverAssignmentAsync("car-1", mockFetcher(3));
    expect(result.valid).toBe(false);
    expect(result.code).toBe("VEHICLE_DRIVER_LIMIT_REACHED");
  });

  it("bloquea con 4 o más conductores", async () => {
    const result = await validateNewDriverAssignmentAsync("car-1", mockFetcher(4));
    expect(result.valid).toBe(false);
  });

  it("pasa el vehicleId correcto al fetcher", async () => {
    const capturedIds: string[] = [];
    const captureFetcher = async (id: string) => {
      capturedIds.push(id);
      return 0;
    };

    await validateNewDriverAssignmentAsync("vehicle-xyz-456", captureFetcher);
    expect(capturedIds).toEqual(["vehicle-xyz-456"]);
  });
});
