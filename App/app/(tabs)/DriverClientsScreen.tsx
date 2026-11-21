import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import CustomAlert, { AlertButton, AlertType } from '@/components/CustomAlert';
import { useHeaderTopPadding, useBottomSafePadding } from '@/hooks/useHeaderTopPadding';
import {
  addExistingClient,
  ClientMatch,
  fetchMyClients,
  NewClientInput,
  PortfolioClient,
  registerClient,
  searchClients,
  setClientActive,
} from '@/common/services/recommendationsService';
import { RootState } from '@/common/store';
import { useAppDispatch } from '@/common/store/hooks';
import { fetchMemberships } from '@/common/reducers/membershipSlice';
import { preferredConductorId } from '@/common/utils/driverIds';
import { findActiveMembership, findCurrentMembership } from '@/common/utils/membershipStatus';

const BG_IMAGE = require('../../assets/images/bg.png');
const DOC_TYPES = ['CC', 'CE', 'PA'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const onlyDigits = (v: string, max = 10) => v.replace(/\D/g, '').slice(0, max);

type FormState = {
  first_name: string;
  last_name: string;
  mobile: string;
  email: string;
  document_type: (typeof DOC_TYPES)[number];
  document_number: string;
};

const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  mobile: '',
  email: '',
  document_type: 'CC',
  document_number: '',
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const validateForm = (f: FormState): FieldErrors => {
  const e: FieldErrors = {};
  if (!f.first_name.trim()) e.first_name = 'Obligatorio';
  if (!f.last_name.trim()) e.last_name = 'Obligatorio';
  if (f.mobile.length !== 10) e.mobile = 'Exactamente 10 dígitos';
  if (!f.email.trim()) e.email = 'Obligatorio';
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Correo no válido';
  if (!f.document_number.trim()) e.document_number = 'Obligatorio';
  return e;
};

const initials = (c: { firstName: string; lastName: string }) =>
  `${c.firstName.charAt(0)}${c.lastName.charAt(0)}`.toUpperCase() || '?';

type NewClientFormProps = {
  saving: boolean;
  onCancel: () => void;
  onSubmit: (form: NewClientInput) => void;
};

/** Formulario aislado: estado local evita re-renders del listado y reduce crashes al tipear en Android. */
const NewClientForm = ({ saving, onCancel, onSubmit }: NewClientFormProps) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const errors = useMemo(() => validateForm(form), [form]);
  const valid = Object.keys(errors).length === 0;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const mark = (key: keyof FormState) => setTouched((t) => ({ ...t, [key]: true }));

  const err = (key: keyof FormState) => (touched[key] ? errors[key] : undefined);

  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      nestedScrollEnabled
      contentContainerStyle={{ paddingBottom: 12 }}
    >
      <Text style={st.sheetHint}>
        Al registrarlo le llegará un correo para crear su contraseña y ver sus viajes en la app.
      </Text>

      <Field label="Nombre" required error={err('first_name')}>
        <TextInput
          style={[st.input, err('first_name') && st.inputError]}
          value={form.first_name}
          onChangeText={(v) => setField('first_name', v)}
          onBlur={() => mark('first_name')}
          autoCapitalize="words"
          autoCorrect={false}
          blurOnSubmit={false}
          placeholderTextColor="rgba(255,255,255,0.35)"
          returnKeyType="next"
        />
      </Field>

      <Field label="Apellido" required error={err('last_name')}>
        <TextInput
          style={[st.input, err('last_name') && st.inputError]}
          value={form.last_name}
          onChangeText={(v) => setField('last_name', v)}
          onBlur={() => mark('last_name')}
          autoCapitalize="words"
          autoCorrect={false}
          blurOnSubmit={false}
          placeholderTextColor="rgba(255,255,255,0.35)"
          returnKeyType="next"
        />
      </Field>

      <Field label="Celular" required error={err('mobile')} hint={form.mobile.length > 0 ? `${form.mobile.length}/10` : undefined}>
        <View style={st.phonePair}>
          <View style={st.prefixBox}>
            <Text style={st.flag}>🇨🇴</Text>
            <Text style={st.phonePrefix}>+57</Text>
          </View>
          <TextInput
            style={[st.phoneInputAlone, err('mobile') && st.inputError]}
            value={form.mobile}
            onChangeText={(v) => setField('mobile', onlyDigits(v, 10))}
            onBlur={() => mark('mobile')}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={10}
            blurOnSubmit={false}
            placeholder="3001234567"
            placeholderTextColor="rgba(255,255,255,0.35)"
          />
        </View>
      </Field>

      <Field label="Correo" required error={err('email')}>
        <TextInput
          style={[st.input, err('email') && st.inputError]}
          value={form.email}
          onChangeText={(v) => setField('email', v.replace(/\s/g, '').toLowerCase())}
          onBlur={() => mark('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          placeholderTextColor="rgba(255,255,255,0.35)"
          returnKeyType="next"
        />
      </Field>

      <Field label="Documento" required error={err('document_number')}>
        <View style={st.docRow}>
          {DOC_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[st.docChip, form.document_type === t && st.docChipOn]}
              onPress={() => setField('document_type', t)}
            >
              <Text style={[st.docChipTxt, form.document_type === t && st.docChipTxtOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={[st.input, { flex: 1 }, err('document_number') && st.inputError]}
            value={form.document_number}
            onChangeText={(v) => {
              setField('document_number', v.replace(/[^0-9A-Za-z]/g, '').slice(0, 20));
              mark('document_number');
            }}
            onBlur={() => mark('document_number')}
            keyboardType="number-pad"
            placeholder="Número"
            placeholderTextColor="rgba(255,255,255,0.35)"
          />
        </View>
      </Field>

      <TouchableOpacity
        style={[st.requestBtn, !valid && st.requestBtnDisabled]}
        onPress={() => {
          setTouched({ first_name: true, last_name: true, mobile: true, email: true, document_number: true });
          if (!valid) return;
          onSubmit({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            mobile: form.mobile,
            email: form.email.trim().toLowerCase(),
            document_type: form.document_type,
            document_number: form.document_number.trim(),
          });
        }}
        disabled={saving || !valid}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#051A26" size="small" />
        ) : (
          <Text style={[st.requestTxt, !valid && st.requestTxtDisabled]}>Registrar cliente</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={st.secondaryBtn} onPress={onCancel} activeOpacity={0.8}>
        <Text style={st.secondaryTxt}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={st.field}>
      <View style={st.fieldLabelRow}>
        <Text style={st.fieldLabel}>
          {label}
          {required ? <Text style={st.req}> *</Text> : null}
        </Text>
        {hint ? <Text style={st.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
      {error ? <Text style={st.fieldError}>{error}</Text> : null}
    </View>
  );
}

const DriverClientsScreen = () => {
  const nav = useNavigation<any>();
  const dispatch = useAppDispatch();
  const topPad = useHeaderTopPadding();
  const bottomPad = useBottomSafePadding(16, 16);
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const profile = useSelector((s: RootState) => s.auth.profile) as any;
  const memberships = useSelector((s: RootState) => s.memberships.memberships);
  const membershipsLoading = useSelector((s: RootState) => s.memberships.loading);

  const driverConductorId = useMemo(
    () => preferredConductorId(user, profile),
    [profile?.id, profile?.auth_id, user?.id, user?.auth_id, user?.uid],
  );

  /** Misma regla que Billetera / admin: solo la membresía más reciente cuenta. */
  const activeMembership = useMemo(
    () => findActiveMembership(memberships),
    [memberships],
  );

  const hasExpiredMembership = useMemo(() => {
    if (activeMembership) return false;
    const current = findCurrentMembership(memberships);
    if (!current) return false;
    const st = String(current.status || '').toUpperCase();
    return st === 'VENCIDA' || st === 'EXPIRADA' || st === 'CANCELADA' || st === 'ACTIVA';
  }, [memberships, activeMembership]);

  const [clients, setClients] = useState<PortfolioClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [matches, setMatches] = useState<ClientMatch[] | null>(null);
  const [pendingForm, setPendingForm] = useState<NewClientInput | null>(null);

  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string; buttons?: AlertButton[] } | null>(null);
  const closeAlert = () => setAlert(null);

  const load = useCallback(async () => {
    try {
      setClients(await fetchMyClients());
    } catch (e: any) {
      setAlert({ type: 'error', title: 'No se pudo cargar tu cartera', message: e?.message || 'Intenta de nuevo.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      if (driverConductorId) {
        dispatch(fetchMemberships(driverConductorId));
      }
    }, [load, dispatch, driverConductorId]),
  );

  useEffect(() => {
    if (driverConductorId) {
      dispatch(fetchMemberships(driverConductorId));
    }
  }, [dispatch, driverConductorId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.firstName, c.lastName, c.phone, c.email].some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [clients, query]);

  const openWallet = () => {
    closeAlert();
    nav.navigate('Wallet');
  };

  const requestTrip = (c: PortfolioClient) => {
    if (membershipsLoading && memberships.length === 0) {
      setAlert({
        type: 'info',
        title: 'Un momento',
        message: 'Estamos verificando tu membresía. Intenta de nuevo en unos segundos.',
        buttons: [{ text: 'Entendido', onPress: closeAlert }],
      });
      return;
    }

    if (!activeMembership) {
      const expired = hasExpiredMembership || memberships.length > 0;
      setAlert({
        type: 'warning',
        title: expired ? 'Membresía vencida' : 'Activa tu membresía',
        message: expired
          ? 'Tu membresía no está vigente. Renúevala en Mi Billetera para pedir viajes recomendados a tus clientes.'
          : 'Para pedir viajes recomendados necesitas una membresía activa. Actívala en Mi Billetera y vuelve a intentarlo.',
        buttons: [
          { text: 'Ahora no', style: 'cancel', onPress: closeAlert },
          {
            text: expired ? 'Renovar membresía' : 'Activar membresía',
            onPress: openWallet,
          },
        ],
      });
      return;
    }

    nav.navigate('CreateReservation', {
      recommendedClient: { id: c.id, name: `${c.firstName} ${c.lastName}`.trim() },
    });
  };

  const removeClient = (c: PortfolioClient) => {
    setAlert({
      type: 'confirm',
      title: 'Quitar de tu cartera',
      message: `${c.firstName} ${c.lastName} ya no aparecerá en tu lista. Su historial de viajes se conserva.`,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: closeAlert },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            closeAlert();
            try {
              await setClientActive(c.id, false);
              setClients((prev) => prev.filter((x) => x.id !== c.id));
            } catch (e: any) {
              setAlert({ type: 'error', title: 'No se pudo quitar', message: e?.message || 'Intenta de nuevo.' });
            }
          },
        },
      ],
    });
  };

  const openForm = () => {
    setMatches(null);
    setPendingForm(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setMatches(null);
    setPendingForm(null);
  };

  const submitForm = async (form: NewClientInput) => {
    setSaving(true);
    setPendingForm(form);
    try {
      const found = await searchClients({
        mobile: form.mobile,
        email: form.email,
        document_number: form.document_number || undefined,
      });
      if (found.length > 0) {
        setMatches(found);
        return;
      }
      const result = await registerClient(form);
      closeForm();
      await load();
      setAlert({
        type: result.warning ? 'warning' : 'success',
        title: 'Cliente registrado',
        message:
          result.warning ||
          `Le enviamos a ${form.email} un correo para crear su contraseña y ver sus viajes en la app.`,
      });
    } catch (e: any) {
      setAlert({ type: 'error', title: 'No se pudo registrar', message: e?.message || 'Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const confirmAdd = async (m: ClientMatch) => {
    if (!pendingForm) return;
    setSaving(true);
    try {
      await addExistingClient(m.id, {
        mobile: pendingForm.mobile,
        email: pendingForm.email,
        document_number: pendingForm.document_number || undefined,
      });
      closeForm();
      await load();
      setAlert({ type: 'success', title: 'Cliente agregado', message: `${m.firstName} ${m.lastName} ya está en tu cartera.` });
    } catch (e: any) {
      setAlert({ type: 'error', title: 'No se pudo agregar', message: e?.message || 'Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const renderClient = ({ item }: { item: PortfolioClient }) => (
    <View style={st.card}>
      <View style={st.cardTop}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={st.avatar} />
        ) : (
          <View style={st.avatarFallback}>
            <Text style={st.avatarTxt}>{initials(item)}</Text>
          </View>
        )}
        <View style={st.cardInfo}>
          <Text style={st.name} numberOfLines={1}>{`${item.firstName} ${item.lastName}`.trim()}</Text>
          <Text style={st.meta} numberOfLines={1}>{item.phone || item.email || '—'}</Text>
          <View style={st.tagsRow}>
            <View style={st.tag}>
              <Text style={st.tagTxt}>{item.origin === 'registrado' ? 'Registrado por ti' : 'Agregado'}</Text>
            </View>
            <Text style={st.meta}>{item.trips} {item.trips === 1 ? 'viaje' : 'viajes'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => removeClient(item)} hitSlop={10} accessibilityLabel="Quitar de mi cartera">
          <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.45)" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[st.requestBtn, item.blocked && st.requestBtnDisabled]}
        onPress={() => requestTrip(item)}
        disabled={item.blocked}
        activeOpacity={0.85}
      >
        <Ionicons name="car" size={16} color="#051A26" />
        <Text style={st.requestTxt}>{item.blocked ? 'Cliente bloqueado' : 'Pedir viaje'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={st.root}>
      <Image source={BG_IMAGE} style={st.bgImage} resizeMode="cover" />
      <View style={st.bgOverlay} />

      <View style={[st.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={st.backBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.eyebrow}>Reservas recomendadas</Text>
          <Text style={st.title}>Mis clientes</Text>
        </View>
        <TouchableOpacity style={st.addBtn} onPress={openForm} activeOpacity={0.85}>
          <Ionicons name="person-add" size={16} color="#051A26" />
          <Text style={st.addTxt}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={st.searchWrap}>
        <Ionicons name="search" size={16} color="rgba(255,255,255,0.45)" />
        <TextInput
          style={st.searchInput}
          placeholder="Buscar en tu cartera"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#00E5FF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={renderClient}
          contentContainerStyle={[st.list, { paddingBottom: bottomPad + 20 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00E5FF" />
          }
          ListEmptyComponent={
            <View style={st.empty}>
              <Ionicons name="people-outline" size={42} color="rgba(0,229,255,0.5)" />
              <Text style={st.emptyTitle}>{query ? 'Sin resultados' : 'Aún no tienes clientes'}</Text>
              <Text style={st.emptyTxt}>
                Registra a un cliente para pedirle viajes. Si otro conductor los realiza, tú le pagas el valor del viaje
                y el cliente te paga lo que acordaron.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={formOpen}
        animationType="slide"
        transparent
        onRequestClose={closeForm}
        statusBarTranslucent
      >
        {/* Sin KeyboardAvoidingView: en Android abre/cierra el teclado en bucle con TextInput. */}
        <View style={st.modalBackdrop}>
          <View style={[st.sheet, { paddingBottom: bottomPad + 8 }]}>
            <View style={st.sheetHeader}>
              <Text style={st.sheetTitle}>{matches ? 'Este cliente ya existe' : 'Nuevo cliente'}</Text>
              <TouchableOpacity onPress={closeForm} hitSlop={10}>
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {matches ? (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={st.sheetHint}>
                  Encontramos una cuenta con esos datos. ¿Quieres agregarla a tu cartera?
                </Text>
                {matches.map((m) => (
                  <View key={m.id} style={st.matchCard}>
                    <Text style={st.name}>{`${m.firstName} ${m.lastName}`.trim()}</Text>
                    <Text style={st.meta}>{[m.maskedPhone, m.maskedEmail].filter(Boolean).join(' · ')}</Text>
                    <Text style={st.meta}>Coincide por: {m.matches.join(', ')}</Text>
                    {m.inPortfolio ? (
                      <Text style={st.matchNote}>Ya está en tu cartera.</Text>
                    ) : !m.isClient ? (
                      <Text style={st.matchNote}>Esta cuenta no es de cliente; no se puede agregar.</Text>
                    ) : (
                      <TouchableOpacity
                        style={st.requestBtn}
                        onPress={() => confirmAdd(m)}
                        disabled={saving}
                        activeOpacity={0.85}
                      >
                        {saving ? (
                          <ActivityIndicator color="#051A26" size="small" />
                        ) : (
                          <Text style={st.requestTxt}>Sí, agregar a mi cartera</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={st.secondaryBtn} onPress={() => setMatches(null)} activeOpacity={0.8}>
                  <Text style={st.secondaryTxt}>No, revisar los datos</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <NewClientForm key={formKey} saving={saving} onCancel={closeForm} onSubmit={submitForm} />
            )}
          </View>
        </View>
      </Modal>

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

const st = StyleSheet.create({
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
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, backgroundColor: '#00E5FF',
  },
  addTxt: { fontSize: 13, fontWeight: '700', color: '#051A26' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)', backgroundColor: 'rgba(10,46,61,0.55)',
  },
  searchInput: { flex: 1, minHeight: 42, color: '#FFF', fontSize: 14 },
  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,229,255,0.14)',
    backgroundColor: 'rgba(10,46,61,0.6)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.12)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)',
  },
  avatarTxt: { color: '#00E5FF', fontWeight: '800', fontSize: 15 },
  cardInfo: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  meta: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(0,229,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)',
  },
  tagTxt: { fontSize: 10, fontWeight: '700', color: '#00E5FF' },
  requestBtn: {
    marginTop: 12, minHeight: 42, borderRadius: 12, backgroundColor: '#00E5FF',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  requestBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.18)' },
  requestTxt: { fontSize: 14, fontWeight: '700', color: '#051A26' },
  requestTxtDisabled: { color: 'rgba(255,255,255,0.45)' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  emptyTxt: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 19 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: '92%', paddingHorizontal: 18, paddingTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: '#0A2533', borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  sheetHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12, lineHeight: 17 },
  field: { marginBottom: 12 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  fieldHint: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  fieldError: { marginTop: 4, fontSize: 11, fontWeight: '600', color: '#FF8A80' },
  req: { color: '#FF5252', fontWeight: '800' },
  input: {
    minHeight: 44, paddingHorizontal: 12, borderRadius: 12, color: '#FFF', fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  inputError: { borderColor: 'rgba(255,82,82,0.7)' },
  phonePair: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefixBox: {
    minHeight: 44, minWidth: 72, paddingHorizontal: 10, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.28)',
  },
  flag: { fontSize: 16 },
  phonePrefix: { fontSize: 14, fontWeight: '700', color: '#00E5FF' },
  phoneInputAlone: {
    flex: 1, minHeight: 44, paddingHorizontal: 12, borderRadius: 12, color: '#FFF', fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docChip: {
    paddingHorizontal: 10, minHeight: 44, borderRadius: 12, justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  docChipOn: { borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.12)' },
  docChipTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  docChipTxtOn: { color: '#00E5FF' },
  matchCard: {
    padding: 14, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
    backgroundColor: 'rgba(0,229,255,0.05)',
  },
  matchNote: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#FFB300' },
  secondaryBtn: { minHeight: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  secondaryTxt: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
});

export default DriverClientsScreen;
