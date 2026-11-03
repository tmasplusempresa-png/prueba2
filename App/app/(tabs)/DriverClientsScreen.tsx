import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

const BG_IMAGE = require('../../assets/images/bg.png');
const DOC_TYPES = ['CC', 'CE', 'PA'] as const;
const EMPTY_FORM: NewClientInput = {
  first_name: '',
  last_name: '',
  mobile: '',
  email: '',
  document_type: 'CC',
  document_number: '',
};

const initials = (c: { firstName: string; lastName: string }) =>
  `${c.firstName.charAt(0)}${c.lastName.charAt(0)}`.toUpperCase() || '?';

/**
 * Cartera del conductor para Reservas recomendadas: clientes a los que puede pedir viajes.
 * Registrar uno nuevo primero busca si ya existe (celular, correo o documento) y pide confirmación.
 */
const DriverClientsScreen = () => {
  const nav = useNavigation<any>();
  const topPad = useHeaderTopPadding();
  const bottomPad = useBottomSafePadding(16, 16);

  const [clients, setClients] = useState<PortfolioClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<NewClientInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [matches, setMatches] = useState<ClientMatch[] | null>(null);

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
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.firstName, c.lastName, c.phone, c.email].some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [clients, query]);

  const requestTrip = (c: PortfolioClient) => {
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
    setForm(EMPTY_FORM);
    setMatches(null);
    setFormOpen(true);
  };

  const lookupInput = () => ({
    mobile: form.mobile.trim(),
    email: form.email.trim().toLowerCase(),
    ...(form.document_number?.trim() ? { document_number: form.document_number.trim() } : {}),
  });

  const submitForm = async () => {
    const required = [form.first_name, form.last_name, form.mobile, form.email];
    if (required.some((v) => !v.trim())) {
      setAlert({ type: 'warning', title: 'Faltan datos', message: 'Nombre, apellido, celular y correo son obligatorios.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setAlert({ type: 'warning', title: 'Correo inválido', message: 'Revisa el correo del cliente: con él entrará a la app.' });
      return;
    }
    setSaving(true);
    try {
      const found = await searchClients(lookupInput());
      if (found.length > 0) {
        setMatches(found);
        return;
      }
      const result = await registerClient({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim().toLowerCase(),
        document_number: form.document_number?.trim() || null,
        document_type: form.document_number?.trim() ? form.document_type : null,
      });
      setFormOpen(false);
      await load();
      setAlert({
        type: result.warning ? 'warning' : 'success',
        title: 'Cliente registrado',
        message: result.warning
          || `Le enviamos a ${form.email.trim().toLowerCase()} un correo para crear su contraseña y ver sus viajes en la app.`,
      });
    } catch (e: any) {
      setAlert({ type: 'error', title: 'No se pudo registrar', message: e?.message || 'Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const confirmAdd = async (m: ClientMatch) => {
    setSaving(true);
    try {
      await addExistingClient(m.id, lookupInput());
      setFormOpen(false);
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

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView style={st.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[st.sheet, { paddingBottom: bottomPad + 8 }]}>
            <View style={st.sheetHeader}>
              <Text style={st.sheetTitle}>{matches ? 'Este cliente ya existe' : 'Nuevo cliente'}</Text>
              <TouchableOpacity onPress={() => setFormOpen(false)} hitSlop={10}>
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
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={st.sheetHint}>
                  Al registrarlo le llegará un correo para crear su contraseña y ver sus viajes en la app.
                </Text>
                {([
                  ['first_name', 'Nombre', 'default'],
                  ['last_name', 'Apellido', 'default'],
                  ['mobile', 'Celular', 'phone-pad'],
                  ['email', 'Correo', 'email-address'],
                ] as const).map(([key, label, keyboard]) => (
                  <View key={key} style={st.field}>
                    <Text style={st.fieldLabel}>{label}</Text>
                    <TextInput
                      style={st.input}
                      value={String(form[key] ?? '')}
                      onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                      keyboardType={keyboard}
                      autoCapitalize={key === 'email' ? 'none' : 'words'}
                      placeholderTextColor="rgba(255,255,255,0.35)"
                    />
                  </View>
                ))}
                <View style={st.field}>
                  <Text style={st.fieldLabel}>Documento (opcional)</Text>
                  <View style={st.docRow}>
                    {DOC_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[st.docChip, form.document_type === t && st.docChipOn]}
                        onPress={() => setForm((f) => ({ ...f, document_type: t }))}
                      >
                        <Text style={[st.docChipTxt, form.document_type === t && st.docChipTxtOn]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                    <TextInput
                      style={[st.input, { flex: 1 }]}
                      value={form.document_number ?? ''}
                      onChangeText={(v) => setForm((f) => ({ ...f, document_number: v }))}
                      keyboardType="number-pad"
                      placeholder="Número"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                    />
                  </View>
                </View>
                <TouchableOpacity style={st.requestBtn} onPress={submitForm} disabled={saving} activeOpacity={0.85}>
                  {saving ? <ActivityIndicator color="#051A26" size="small" /> : <Text style={st.requestTxt}>Registrar cliente</Text>}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
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
  requestBtnDisabled: { opacity: 0.4 },
  requestTxt: { fontSize: 14, fontWeight: '700', color: '#051A26' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  emptyTxt: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 19 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: '88%', paddingHorizontal: 18, paddingTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: '#0A2533', borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  sheetHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12, lineHeight: 17 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#FFF', marginBottom: 6 },
  input: {
    minHeight: 44, paddingHorizontal: 12, borderRadius: 12, color: '#FFF', fontSize: 14,
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
