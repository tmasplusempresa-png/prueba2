import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert, { AlertButton, AlertType } from '@/components/CustomAlert';
import { useHeaderTopPadding, useBottomSafePadding } from '@/hooks/useHeaderTopPadding';
import { DAVIPLATA_LOGO_URI, NEQUI_LOGO_URI } from '@/common/utils/paymentMode';
import {
  DriverPaymentMethods,
  fetchMyPaymentMethods,
  saveMyPaymentMethods,
} from '@/common/services/driverPaymentMethodsService';

const BG_IMAGE = require('../../assets/images/bg.png');
const MONEY_GREEN = '#2EAD5B';
const digits10 = (v: string) => v.replace(/\D/g, '').slice(0, 10);

type Form = {
  daviplataNumero: string;
  nequi: boolean;
  nequiNumero: string;
  breb: boolean;
  nequiBreb: string;
};

const emptyForm = (): Form => ({
  daviplataNumero: '',
  nequi: false,
  nequiNumero: '',
  breb: false,
  nequiBreb: '',
});

/** Floating label sin prefix dentro (evita solapar +57). */
const FloatingField = ({
  label,
  value,
  onChangeText,
  required,
  error,
  keyboardType,
  maxLength,
  autoCapitalize = 'none',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  required?: boolean;
  error?: string;
  keyboardType?: 'default' | 'number-pad' | 'email-address';
  maxLength?: number;
  autoCapitalize?: 'none' | 'characters' | 'words';
}) => {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;
  const anim = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: floated ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [floated, anim]);

  const labelTop = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 4] });
  const labelSize = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 11] });

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.floatWrap, focused && s.floatWrapOn, !!error && s.inputError]}>
        <Animated.Text
          style={[
            s.floatLabel,
            { top: labelTop, fontSize: labelSize, color: focused ? '#00E5FF' : 'rgba(255,255,255,0.45)' },
          ]}
          pointerEvents="none"
        >
          {label}{required ? ' *' : ''}
        </Animated.Text>
        {/* paddingTop fijo: animar layout del TextInput en Android cierra el teclado */}
        <View style={[s.floatRow, { paddingTop: 16 }]}>
          <TextInput
            style={s.floatInput}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType={keyboardType}
            maxLength={maxLength}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            blurOnSubmit={false}
            importantForAutofill="no"
            placeholder=""
          />
          {typeof maxLength === 'number' && keyboardType === 'number-pad' ? (
            <Text style={s.counter}>{value.length}/{maxLength}</Text>
          ) : null}
        </View>
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
};

/** Prefijo +57 en caja propia, separado del input con floating label. */
const PhoneField = ({
  label,
  value,
  onChangeText,
  required,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  required?: boolean;
  error?: string;
}) => (
  <View style={{ marginBottom: 4 }}>
    <View style={s.phonePair}>
      <View style={s.prefixBox}>
        <Text style={s.flag}>🇨🇴</Text>
        <Text style={s.prefix}>+57</Text>
      </View>
      <FloatingField
        label={label}
        value={value}
        onChangeText={onChangeText}
        required={required}
        error={undefined}
        keyboardType="number-pad"
        maxLength={10}
      />
    </View>
    {error ? <Text style={s.error}>{error}</Text> : null}
  </View>
);

const MethodCard = ({
  logo,
  icon,
  iconColor,
  title,
  subtitle,
  required,
  enabled,
  locked,
  onToggle,
  children,
  delay = 0,
}: {
  logo?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  title: string;
  subtitle: string;
  required?: boolean;
  enabled: boolean;
  locked?: boolean;
  onToggle?: (v: boolean) => void;
  children?: React.ReactNode;
  delay?: number;
}) => {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 400,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, enter]);

  return (
    <Animated.View
      style={[
        s.card,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <View style={s.cardHead}>
        <View style={[s.logoWrap, logo ? s.logoWrapLogo : null]}>
          {logo ? (
            <Image source={{ uri: logo }} style={s.logo} resizeMode="contain" />
          ) : (
            <Ionicons name={icon || 'cash-outline'} size={22} color={iconColor || '#00E5FF'} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <Text style={s.cardTitle}>{title}</Text>
            {required ? (
              <View style={s.reqPill}>
                <Text style={s.reqPillTxt}>Obligatorio</Text>
              </View>
            ) : null}
          </View>
          <Text style={s.cardSub}>{subtitle}</Text>
        </View>
        {onToggle ? (
          <Switch
            value={enabled}
            onValueChange={onToggle}
            disabled={locked}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(0,229,255,0.45)' }}
            thumbColor={enabled ? '#00E5FF' : '#8899A6'}
          />
        ) : locked ? (
          <View style={s.lockPill}>
            <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.55)" />
          </View>
        ) : null}
      </View>
      {/* Sin Animated maxHeight: en Android clippea el TextInput y el teclado se cierra solo. */}
      {enabled && children ? <View style={s.cardBody}>{children}</View> : null}
    </Animated.View>
  );
};

const DriverPaymentMethodsScreen = () => {
  const nav = useNavigation<any>();
  const topPad = useHeaderTopPadding();
  const bottomPad = useBottomSafePadding(16, 16);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [baseline, setBaseline] = useState<Form>(emptyForm);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string; buttons?: AlertButton[] } | null>(null);
  const saveScale = useRef(new Animated.Value(1)).current;

  const closeAlert = () => setAlert(null);

  const applyRemote = (m: DriverPaymentMethods) => {
    const next: Form = {
      daviplataNumero: m.daviplata_numero || '',
      nequi: m.nequi === true,
      nequiNumero: m.nequi_numero || '',
      breb: m.breb_activo === true || !!m.nequi_breb,
      nequiBreb: m.nequi_breb || '',
    };
    setForm(next);
    setBaseline(next);
  };

  const load = useCallback(async () => {
    try {
      applyRemote(await fetchMyPaymentMethods());
    } catch (e: any) {
      setAlert({ type: 'error', title: 'No se pudo cargar', message: e?.message || 'Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const dirty = useMemo(
    () =>
      form.daviplataNumero !== baseline.daviplataNumero ||
      form.nequi !== baseline.nequi ||
      form.nequiNumero !== baseline.nequiNumero ||
      form.breb !== baseline.breb ||
      form.nequiBreb !== baseline.nequiBreb,
    [form, baseline],
  );

  const davOk = form.daviplataNumero.length === 0 || form.daviplataNumero.length === 10;
  const nequiOk = !form.nequi || form.nequiNumero.length === 10;
  const brebOk = !form.breb || form.nequiBreb.trim().length > 0;
  // DaviPlata ya no bloquea guardar Nequi / Llave; solo valida si escribieron dígitos incompletos.
  const canSave = dirty && davOk && nequiOk && brebOk && !saving;

  const onSave = async () => {
    if (!canSave) {
      Animated.sequence([
        Animated.timing(saveScale, { toValue: 0.96, duration: 70, useNativeDriver: true }),
        Animated.spring(saveScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
      return;
    }
    setSaving(true);
    try {
      const hasDav = form.daviplataNumero.length === 10;
      const saved = await saveMyPaymentMethods({
        efectivo: true,
        daviplata: hasDav,
        daviplata_numero: hasDav ? form.daviplataNumero : '',
        nequi: form.nequi,
        nequi_numero: form.nequi ? form.nequiNumero : null,
        breb_activo: form.breb,
        nequi_breb: form.breb ? form.nequiBreb.trim() : null,
      });
      applyRemote(saved);
      setAlert({
        type: 'success',
        title: 'Métodos guardados',
        message: hasDav
          ? 'Así podrán pagarte en viajes empresariales y en liquidaciones de recomendaciones.'
          : 'Nequi / Llave guardados. Completa DaviPlata cuando puedas: es necesario para viajes empresariales.',
      });
    } catch (e: any) {
      setAlert({ type: 'error', title: 'No se pudo guardar', message: e?.message || 'Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.root}>
      <Image source={BG_IMAGE} style={s.bgImage} resizeMode="cover" />
      <View style={s.bgOverlay} />

      <View style={[s.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>Conductor</Text>
          <Text style={s.title}>Mi método de pago</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#00E5FF" style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: bottomPad + 24 }]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <Text style={s.intro}>
            Elige cómo te pagan. DaviPlata es obligatorio para viajes empresariales. En recomendaciones, el
            conductor que solicitó verá estas opciones (excepto efectivo) para liquidarte.
          </Text>

          <MethodCard
            icon="cash-outline"
            iconColor={MONEY_GREEN}
            title="Efectivo"
            subtitle="Siempre disponible para cobros en persona"
            enabled
            locked
            delay={40}
          />

          <MethodCard
            logo={DAVIPLATA_LOGO_URI}
            title="DaviPlata"
            subtitle="Obligatorio · aquí se pagan viajes empresariales"
            required
            enabled
            locked
            delay={100}
          >
            <PhoneField
              label="Número DaviPlata"
              required
              value={form.daviplataNumero}
              onChangeText={(v) => setForm((f) => ({ ...f, daviplataNumero: digits10(v) }))}
              error={form.daviplataNumero.length > 0 && !davOk ? 'Exactamente 10 dígitos' : undefined}
            />
          </MethodCard>

          <MethodCard
            logo={NEQUI_LOGO_URI}
            title="Nequi"
            subtitle="Actívalo si quieres recibir por Nequi"
            enabled={form.nequi}
            onToggle={(v) => setForm((f) => ({ ...f, nequi: v, nequiNumero: v ? f.nequiNumero : '' }))}
            delay={160}
          >
            <PhoneField
              label="Número Nequi"
              required
              value={form.nequiNumero}
              onChangeText={(v) => setForm((f) => ({ ...f, nequiNumero: digits10(v) }))}
              error={
                form.nequi && form.nequiNumero.length > 0 && form.nequiNumero.length !== 10
                  ? 'Exactamente 10 dígitos'
                  : undefined
              }
            />
          </MethodCard>

          <MethodCard
            icon="key-outline"
            title="Llave Bre-b"
            subtitle="De cualquier banco o billetera digital"
            enabled={form.breb}
            onToggle={(v) => setForm((f) => ({ ...f, breb: v, nequiBreb: v ? f.nequiBreb : '' }))}
            delay={220}
          >
            <FloatingField
              label="Llave Bre-b"
              required
              value={form.nequiBreb}
              onChangeText={(v) => setForm((f) => ({ ...f, nequiBreb: v.slice(0, 80) }))}
              error={form.breb && !form.nequiBreb.trim() ? 'Escribe tu llave Bre-b' : undefined}
            />
          </MethodCard>

          <Animated.View style={{ transform: [{ scale: saveScale }] }}>
            <Pressable style={[s.saveBtn, !canSave && s.saveBtnOff]} onPress={onSave} disabled={saving || !canSave}>
              {saving ? (
                <ActivityIndicator color="#1A3A2A" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={canSave ? '#1A3A2A' : 'rgba(255,255,255,0.35)'} />
                  <Text style={[s.saveTxt, !canSave && s.saveTxtOff]}>Guardar métodos</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
          {!dirty ? (
            <Text style={s.hintIdle}>Sin cambios por guardar</Text>
          ) : !davOk ? (
            <Text style={s.hintIdle}>DaviPlata: deja vacío o escribe exactamente 10 dígitos</Text>
          ) : !nequiOk ? (
            <Text style={s.hintIdle}>Completa el número Nequi (10 dígitos)</Text>
          ) : !brebOk ? (
            <Text style={s.hintIdle}>Escribe tu llave Bre-b o desactívala</Text>
          ) : null}
        </ScrollView>
      )}

      <CustomAlert
        visible={!!alert}
        type={alert?.type}
        title={alert?.title || ''}
        message={alert?.message || ''}
        buttons={alert?.buttons || [{ text: 'OK', onPress: closeAlert }]}
        onDismiss={closeAlert}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#051A26' },
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.22 },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,26,38,0.82)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: '#00E5FF', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  content: { paddingHorizontal: 16, gap: 12 },
  intro: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 19, marginBottom: 4 },
  card: {
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,229,255,0.16)',
    backgroundColor: 'rgba(10,46,61,0.72)', padding: 14, overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoWrap: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  logoWrapLogo: { backgroundColor: '#FFF', padding: 4 },
  logo: { width: 40, height: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 16 },
  reqPill: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
    backgroundColor: 'rgba(255,82,82,0.15)', borderWidth: 1, borderColor: 'rgba(255,82,82,0.35)',
  },
  reqPillTxt: { fontSize: 10, fontWeight: '800', color: '#FF8A80' },
  lockPill: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardBody: { paddingTop: 12 },
  phonePair: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  prefixBox: {
    minHeight: 54, minWidth: 72, paddingHorizontal: 10, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.28)',
  },
  floatWrap: {
    minHeight: 54, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  floatWrapOn: { borderColor: 'rgba(0,229,255,0.55)' },
  floatLabel: { position: 'absolute', left: 12, fontWeight: '700' },
  floatRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  floatInput: { flex: 1, color: '#FFF', fontSize: 15, paddingVertical: 0, minHeight: 28 },
  flag: { fontSize: 15 },
  prefix: { fontSize: 14, fontWeight: '800', color: '#00E5FF' },
  counter: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  inputError: { borderColor: 'rgba(255,82,82,0.7)' },
  error: { marginTop: 6, fontSize: 11, fontWeight: '600', color: '#FF8A80' },
  saveBtn: {
    marginTop: 8, minHeight: 50, borderRadius: 14,
    backgroundColor: '#A8E6CF',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(46,173,91,0.35)',
  },
  saveBtnOff: { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.08)' },
  saveTxt: { fontSize: 16, fontWeight: '900', color: '#1A3A2A', letterSpacing: 0.3 },
  saveTxtOff: { color: 'rgba(255,255,255,0.35)', fontWeight: '800' },
  hintIdle: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: -4 },
});

export default DriverPaymentMethodsScreen;
