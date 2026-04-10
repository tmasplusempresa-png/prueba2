# 📋 GUÍA DE IMPLEMENTACIÓN - INMEDIATO vs PROGRAMADO

## Cambios a realizar en CreateReservationScreen.tsx

### 1️⃣ AGREGAR CONSTANTES (después de generateReference)

```typescript
// ⭐ TARIFAS FIJAS PARA VIAJES PROGRAMADOS
const SCHEDULED_PRICES: { [key: string]: number } = {
  'T+Plus Especial': 15000,
  'Particular': 12000,
  'Van': 18000,
  'Taxi': 10000,
};

// ⭐ FUNCIÓN PARA INICIALIZAR HORA: AHORA +5 MIN
const getInitialScheduledDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 5);
  return d;
};
```

---

### 2️⃣ REEMPLAZAR ESTADO scheduledDate + AGREGAR bookingMode 

**BÚSQUEDA (línea ~81):**
```typescript
  /* ── Trip details ── */
  const [carType, setCarType] = useState(params.carType || 'T+Plus Especial');
  const [tripType, setTripType] = useState<'Ida' | 'Ida y Vuelta'>('Ida');
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [observations, setObservations] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'nequi' | 'daviplata'>('cash');
```

**REEMPLAZO POR:**
```typescript
  /* ── Trip details ── */
  const [carType, setCarType] = useState(params.carType || 'T+Plus Especial');
  const [tripType, setTripType] = useState<'Ida' | 'Ida y Vuelta'>('Ida');
  const [bookingMode, setBookingMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState<Date>(getInitialScheduledDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [observations, setObservations] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'nequi' | 'daviplata'>('cash');
```

---

### 3️⃣ REEMPLAZAR calculateRoute() 

**BÚSQUEDA (línea ~225):**
```typescript
  const calculateRoute = async () => {
    if (!origin?.latitude || !destination?.latitude) return;
    setCalculating(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_KEY}&language=es`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.routes?.length > 0) {
        const leg = data.routes[0].legs[0];
        const distKm = leg.distance.value / 1000;
        const durMin = leg.duration.value / 60;
        const mult = tripType === 'Ida y Vuelta' ? 2 : 1;
        setDistance(distKm);
        setDuration(durMin);
        const base = roundPrice((distKm * 2500 + 7000) * mult);
        setDriverPrice(base);
        setClientPrice(roundPrice(base + 7000));
      }
    } catch (e) {
      console.error('Route calc error:', e);
    } finally {
      setCalculating(false);
    }
  };
```

**REEMPLAZO POR:**
```typescript
  const calculateRoute = async () => {
    if (!origin?.latitude || !destination?.latitude) return;
    setCalculating(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_KEY}&language=es`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.routes?.length > 0) {
        const leg = data.routes[0].legs[0];
        const distKm = leg.distance.value / 1000;
        const durMin = leg.duration.value / 60;
        const mult = tripType === 'Ida y Vuelta' ? 2 : 1;
        setDistance(distKm);
        setDuration(durMin);

        // ⭐ DIFERENCIAR PRECIO SEGÚN MODO
        if (bookingMode === 'immediate') {
          // DINÁMICO: según distancia y tiempo
          const base = roundPrice((distKm * 2500 + 7000) * mult);
          setDriverPrice(base);
          setClientPrice(roundPrice(base + 7000));
          console.log('⚡ INMEDIATO - Precio dinámico:', base);
        } else {
          // FIJO: según tabla de tarifas
          const fixedPrice = SCHEDULED_PRICES[carType] || 15000;
          const finalPrice = mult === 2 
            ? roundPrice(fixedPrice * 2)  // Ida y Vuelta = x2
            : roundPrice(fixedPrice);
          setDriverPrice(finalPrice);
          setClientPrice(roundPrice(finalPrice + 2000));
          console.log('📅 PROGRAMADO - Precio fijo:', finalPrice);
        }
      }
    } catch (e) {
      console.error('Route calc error:', e);
    } finally {
      setCalculating(false);
    }
  };
```

---

### 4️⃣ AGREGAR useEffect PARA ACTUALIZAR HORA SEGÚN MODO

**INSERTAR DESPUÉS DE calculateRoute() (línea ~265):**

```typescript
  /* ── Update scheduledDate when bookingMode changes ── */
  useEffect(() => {
    if (bookingMode === 'immediate') {
      const d = new Date();
      d.setMinutes(d.getMinutes() + 5);
      setScheduledDate(d);
    } else {
      const d = new Date();
      d.setHours(d.getHours() + 1);
      d.setMinutes(0);
      setScheduledDate(d);
    }
  }, [bookingMode]);

  /* ── Recalcular cuando cambia modo o vehículo ── */
  useEffect(() => {
    if (origin?.latitude && destination?.latitude) {
      calculateRoute();
    }
  }, [bookingMode, carType, tripType, origin, destination]);
```

---

### 5️⃣ EN handleSubmit() - AGREGAR booking_mode al body

**BÚSQUEDA (línea ~355):**
```typescript
      const body = {
        booking_type: 'reservation',
        status: 'PENDING',
        customer_status: 'NEW',
        reference: generateReference(),
```

**REEMPLAZO POR:**
```typescript
      const body = {
        booking_type: 'reservation',
        booking_mode: bookingMode,  // ⭐ NUEVA LÍNEA
        status: 'PENDING',
        customer_status: 'NEW',
        reference: generateReference(),
```

---

### 6️⃣ EN RENDER - AGREGAR TOGGLE UI

**INSERTAR DESPUÉS DE routeCard y ANTES de "Tipo de Vehículo" (línea ~590):**

```typescript
          {/* ════ BOOKING MODE TOGGLE ════ */}
          <Animatable.View animation="fadeInUp" duration={250} delay={0} useNativeDriver>
            <Text style={st.label}>Tipo de Viaje</Text>
            <View style={st.bookingModeRow}>
              {[
                { mode: 'immediate' as const, label: '⚡ Inmediato', desc: 'Ahora +5 min' },
                { mode: 'scheduled' as const, label: '📅 Programado', desc: 'Elige la hora' },
              ].map((b) => (
                <TouchableOpacity
                  key={b.mode}
                  style={[st.bookingModeBtn, bookingMode === b.mode && st.bookingModeBtnActive]}
                  onPress={() => setBookingMode(b.mode)}
                  activeOpacity={0.8}
                >
                  <Text style={[st.bookingModeLabel, bookingMode === b.mode && st.bookingModeLabelActive]}>
                    {b.label}
                  </Text>
                  <Text style={[st.bookingModeDesc, bookingMode === b.mode && st.bookingModeDescActive]}>
                    {b.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>
```

---

### 7️⃣ EN RENDER - HACER FECHA CONDICIONAL

**BÚSQUEDA (línea ~680):**
```typescript
          {/* Date */}
          <Animatable.View animation="fadeInUp" duration={250} delay={60} useNativeDriver>
            <Text style={st.label}>Fecha</Text>
            <TouchableOpacity style={st.infoCard} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
              <Ionicons name="calendar-outline" size={20} color="#00E5FF" />
              <Text style={st.infoVal}>{fmtDate(scheduledDate)}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </Animatable.View>
```

**REEMPLAZO POR:**
```typescript
          {/* Date - Solo si es PROGRAMADO */}
          {bookingMode === 'scheduled' && (
            <Animatable.View animation="fadeInUp" duration={250} delay={60} useNativeDriver>
              <Text style={st.label}>Fecha</Text>
              <TouchableOpacity style={st.infoCard} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={20} color="#00E5FF" />
                <Text style={st.infoVal}>{fmtDate(scheduledDate)}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </Animatable.View>
          )}
```

---

### 8️⃣ EN RENDER - HORA CONDICIONAL Y CON ETIQUETA

**BÚSQUEDA (línea ~690):**
```typescript
          {/* Time */}
          <Animatable.View animation="fadeInUp" duration={250} delay={80} useNativeDriver>
            <Text style={st.label}>Hora</Text>
            <TouchableOpacity style={st.infoCard} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
              <Ionicons name="time-outline" size={20} color="#00E5FF" />
              <Text style={st.infoVal}>{fmtTime(scheduledDate)}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </Animatable.View>
```

**REEMPLAZO POR:**
```typescript
          {/* Time - Mostrar siempre, pero con comportamiento diferente */}
          <Animatable.View animation="fadeInUp" duration={250} delay={bookingMode === 'scheduled' ? 80 : 60} useNativeDriver>
            <Text style={st.label}>
              {bookingMode === 'immediate' ? 'Hora (Automática)' : 'Hora'}
            </Text>
            <TouchableOpacity 
              style={[st.infoCard, bookingMode === 'immediate' && { opacity: 0.6 }]} 
              onPress={() => bookingMode === 'scheduled' && setShowTimePicker(true)}
              disabled={bookingMode === 'immediate'}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={20} color="#00E5FF" />
              <Text style={st.infoVal}>
                {bookingMode === 'immediate' ? `${fmtTime(scheduledDate)} ⚡` : fmtTime(scheduledDate)}
              </Text>
              {bookingMode === 'scheduled' && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />}
            </TouchableOpacity>
          </Animatable.View>
```

---

### 9️⃣ EN RENDER - PRECIO CON ETIQUETA DE TIPO

**BÚSQUEDA (línea ~710):**
```typescript
          {/* Prices */}
          <Animatable.View animation="fadeInUp" duration={250} delay={100} useNativeDriver>
            <Text style={st.label}>Valor Estimado</Text>
            <View style={st.priceRow}>
```

**REEMPLAZO POR:**
```typescript
          {/* Prices */}
          <Animatable.View animation="fadeInUp" duration={250} delay={100} useNativeDriver>
            <Text style={st.label}>
              Valor Estimado {bookingMode === 'immediate' ? '⚡ (Dinámico)' : '📅 (Fijo)'}
            </Text>
            <View style={st.priceRow}>
```

---

### 🔟 AGREGAR ESTILOS AL STYLESHEET

**AL FINAL DEL ARCHIVO, en const st = StyleSheet.create({ ... }) AGREGAR:**

```typescript
  bookingModeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  bookingModeBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingModeBtnActive: {
    backgroundColor: 'rgba(0,229,255,0.25)',
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bookingModeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  bookingModeLabelActive: {
    color: '#00E5FF',
  },
  bookingModeDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  bookingModeDescActive: {
    color: 'rgba(255,255,255,0.8)',
  },
```

---

## ✅ RESUMEN DE CAMBIOS

✔️ Agregar constantes SCHEDULED_PRICES y getInitialScheduledDate  
✔️ Agregar estado bookingMode  
✔️ Reemplazar calculateRoute() con lógica condicional  
✔️ Agregar useEffect para actualizar hora según modo  
✔️ Agregar toggle UI en render  
✔️ Hacer fecha condicional (solo programado)  
✔️ Hacer hora condicional (no editable en inmediato)  
✔️ Incluir booking_mode en handleSubmit body  
✔️ Agregar estilos CSS

---

## 🚀 PRÓXIMO PASO

Una vez hecho esto, ejecuta en la terminal:
```bash
npx expo start -c
```

Y prueba en el emulador/dispositivo 📱
