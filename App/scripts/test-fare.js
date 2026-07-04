/**
 * Prueba interactiva del cálculo de tarifa.
 * Ejecutar: node scripts/test-fare.js
 *
 * Replica exactamente la lógica de:
 *   common/actions/FareCalculator.tsx
 *   engine.py (delta_programado fix)
 */

const readline = require('readline');

// ─── Constantes del negocio ────────────────────────────────────────────────
const DELTA_PROGRAMADO_FIJO = 4_000;   // recargo programado sin aeropuerto
const DELTA_PROTOCOLO       = 5_000;   // recargo bioseguridad
const MARGEN_CLIENTE        = 1.25;    // conductor recibe 80 %, cliente paga 25 % más

// ─── Formato moneda colombiana ─────────────────────────────────────────────
const fmt = (v) => `$${Math.round(v).toLocaleString('es-CO')}`;

// ─── Motor de cálculo ──────────────────────────────────────────────────────
function calcularTarifa(rates, params) {
  const {
    distanceKm,
    durationMin,
    isAirport   = false,
    isScheduled = false,
    isProtocol  = false,
    tolls       = 0,
    parking     = 0,
  } = params;

  const umbral        = rates.umbral_intermunicipal_km || 29;
  const isInter       = distanceKm > umbral;
  const cobertura     = isInter ? 'Intermunicipal' : 'Urbano';

  const baseFare      = isInter ? rates.base_fare_inter    : rates.base_fare;
  const pricePerKm    = isInter ? rates.price_per_km_inter : rates.price_per_km;
  const pricePerMin   = isInter ? rates.rate_per_hour_inter: rates.rate_per_hour;
  const minFare       = isInter ? rates.min_fare_inter     : rates.min_fare;

  const costoKm        = pricePerKm  * distanceKm;
  const costoTiempo    = pricePerMin * durationMin;
  const dAeropuerto    = isAirport   ? rates.delta_aeropuerto : 0;
  const dProgramado    = isScheduled ? (isAirport ? rates.delta_aeropuerto_prog : DELTA_PROGRAMADO_FIJO) : 0;
  const dProtocolo     = isProtocol  ? DELTA_PROTOCOLO : 0;

  const suma           = baseFare + costoKm + costoTiempo + dAeropuerto + dProgramado + dProtocolo + tolls + parking;
  const rawTotal       = Math.max(suma, minFare);
  let   totalConductor = Math.ceil(rawTotal / 100) * 100;

  const valorCliente   = Math.ceil(rawTotal * MARGEN_CLIENTE / 100) * 100;

  return {
    cobertura,
    baseFare, costoKm, costoTiempo,
    dAeropuerto, dProgramado, dProtocolo, tolls, parking,
    suma, minFare, totalConductor, valorCliente,
  };
}

// ─── Impresión del resultado ───────────────────────────────────────────────
function printResult(nombreCategoria, result, distanceKm, durationMin) {
  const sep = '─'.repeat(44);
  console.log('\n' + sep);
  console.log(` CATEGORÍA : ${nombreCategoria}`);
  console.log(` COBERTURA : ${result.cobertura}   (${distanceKm} km · ${durationMin} min)`);
  console.log(sep);
  console.log(` Tarifa base        : ${fmt(result.baseFare)}`);
  console.log(` Costo km           : ${fmt(result.costoKm)}   (${distanceKm} km)`);
  console.log(` Costo tiempo       : ${fmt(result.costoTiempo)}   (${durationMin} min)`);
  if (result.dAeropuerto)  console.log(` Delta aeropuerto   : ${fmt(result.dAeropuerto)}`);
  if (result.dProgramado)  console.log(` Delta programado   : ${fmt(result.dProgramado)}`);
  if (result.dProtocolo)   console.log(` Protocolo covid    : ${fmt(result.dProtocolo)}`);
  if (result.tolls)        console.log(` Peajes             : ${fmt(result.tolls)}`);
  if (result.parking)      console.log(` Parqueadero        : ${fmt(result.parking)}`);
  console.log(sep);
  console.log(` Subtotal bruto     : ${fmt(result.suma)}`);
  if (result.totalConductor !== Math.ceil(result.suma / 100) * 100)
    console.log(` Cobro mínimo aplic.: ${fmt(result.minFare)}`);
  console.log(` ► Total conductor  : ${fmt(result.totalConductor)}`);
  console.log(` ► Valor cliente    : ${fmt(result.valorCliente)}`);
  console.log(` Rango estimado     : ${fmt(result.totalConductor)} – ${fmt(result.valorCliente)}`);
  console.log(sep + '\n');
}

// ─── Helpers readline ─────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const askFloat = async (q, def = 0) => {
  const raw = await ask(q);
  const val = parseFloat(raw.trim());
  return isNaN(val) ? def : val;
};

const askBool = async (q) => {
  const raw = await ask(q + ' (s/n): ');
  return raw.trim().toLowerCase() === 's';
};

// ─── Flujo principal ──────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   PRUEBA DE CÁLCULO DE TARIFA  T+Plus    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ── 1. Datos del viaje ──────────────────────────────────────────────────
  console.log('── DATOS DEL VIAJE ────────────────────────');
  const distanceKm  = await askFloat('  Distancia (km)          : ');
  const durationMin = await askFloat('  Duración  (minutos)     : ');
  const isAirport   = await askBool ('  ¿Incluye aeropuerto?');
  const isScheduled = await askBool ('  ¿Es programado?');
  const isProtocol  = await askBool ('  ¿Aplica protocolo bioseguridad?');
  const tolls       = await askFloat('  Peajes ($, 0 si no hay) : ', 0);
  const parking     = await askFloat('  Parqueadero ($)         : ', 0);

  const params = { distanceKm, durationMin, isAirport, isScheduled, isProtocol, tolls, parking };

  // ── 2. Datos de la categoría ────────────────────────────────────────────
  console.log('\n── CATEGORÍA (desde car_types en Supabase) ');
  console.log('   Deja vacío para usar 0.\n');

  const nombreCategoria = (await ask('  Nombre de la categoría         : ')).trim() || 'Sin nombre';

  const rates = {
    umbral_intermunicipal_km : await askFloat('  Umbral intermunicipal (km)     : ', 29),
    base_fare                : await askFloat('  Tarifa base (urbano)           : '),
    base_fare_inter          : await askFloat('  Tarifa base (intermunicipal)   : '),
    price_per_km             : await askFloat('  Precio/km (urbano)             : '),
    price_per_km_inter       : await askFloat('  Precio/km (intermunicipal)     : '),
    rate_per_hour            : await askFloat('  Precio/min (urbano)            : '),
    rate_per_hour_inter      : await askFloat('  Precio/min (intermunicipal)    : '),
    min_fare                 : await askFloat('  Cobro mínimo (urbano)          : '),
    min_fare_inter           : await askFloat('  Cobro mínimo (intermunicipal)  : '),
    delta_aeropuerto         : await askFloat('  Delta aeropuerto               : ', 12000),
    delta_aeropuerto_prog    : await askFloat('  Delta aeropuerto + programado  : ', 4800),
  };

  // ── 3. Calcular y mostrar ───────────────────────────────────────────────
  const result = calcularTarifa(rates, params);
  printResult(nombreCategoria, result, distanceKm, durationMin);

  // ── 4. ¿Probar otra categoría? ──────────────────────────────────────────
  const otra = await askBool('¿Calcular otra categoría con el mismo viaje?');
  rl.close();

  if (otra) {
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask2 = (q) => new Promise((res) => rl2.question(q, res));
    const askFloat2 = async (q, def = 0) => {
      const raw = await ask2(q);
      const val = parseFloat(raw.trim());
      return isNaN(val) ? def : val;
    };

    console.log('\n── SEGUNDA CATEGORÍA ──────────────────────');
    const nombre2 = (await ask2('  Nombre : ')).trim() || 'Categoría 2';
    const rates2 = {
      umbral_intermunicipal_km : await askFloat2('  Umbral intermunicipal (km)     : ', 29),
      base_fare                : await askFloat2('  Tarifa base (urbano)           : '),
      base_fare_inter          : await askFloat2('  Tarifa base (intermunicipal)   : '),
      price_per_km             : await askFloat2('  Precio/km (urbano)             : '),
      price_per_km_inter       : await askFloat2('  Precio/km (intermunicipal)     : '),
      rate_per_hour            : await askFloat2('  Precio/min (urbano)            : '),
      rate_per_hour_inter      : await askFloat2('  Precio/min (intermunicipal)    : '),
      min_fare                 : await askFloat2('  Cobro mínimo (urbano)          : '),
      min_fare_inter           : await askFloat2('  Cobro mínimo (intermunicipal)  : '),
      delta_aeropuerto         : await askFloat2('  Delta aeropuerto               : ', 12000),
      delta_aeropuerto_prog    : await askFloat2('  Delta aeropuerto + programado  : ', 4800),
    };
    const result2 = calcularTarifa(rates2, params);
    printResult(nombre2, result2, distanceKm, durationMin);
    rl2.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
