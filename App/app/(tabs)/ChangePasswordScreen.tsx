import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { supabase } from '@/config/SupabaseConfig';
import { RootState } from '@/common/store';
import { logout } from '@/common/reducers/authReducer';

type Props = NativeStackScreenProps<any>;

const THEME = {
  darkBg: '#051A26',
  primaryCyan: '#00E5FF',
  textMain: '#FFFFFF',
  textMuted: '#8aa1b1',
  glassBg: 'rgba(10, 46, 61, 0.56)',
  glassBorder: 'rgba(0, 229, 255, 0.22)',
  errorColor: '#E91E63',
};

type AlertState = {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  buttons: AlertButton[];
};

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const dispatch = useDispatch();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newVisible, setNewVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback(
    (type: AlertState['type'], title: string, message: string, buttons?: AlertButton[]) => {
      setAlert({
        visible: true,
        type,
        title,
        message,
        buttons: buttons || [
          { text: 'OK', onPress: () => setAlert(a => ({ ...a, visible: false })) },
        ],
      });
    },
    [],
  );

  const validate = (): string | null => {
    if (!newPassword || newPassword.length < 6) {
      return 'La nueva contraseña debe tener al menos 6 caracteres.';
    }
    if (newPassword !== confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  };

  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      showAlert('error', 'Error', validationError);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        showAlert('error', 'Sesión expirada', 'Por favor inicia sesión nuevamente.', [
          {
            text: 'OK',
            onPress: () => {
              setAlert(a => ({ ...a, visible: false }));
              dispatch(logout());
            },
          },
        ]);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      showAlert(
        'success',
        'Listo',
        'Tu contraseña fue actualizada correctamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              setAlert(a => ({ ...a, visible: false }));
              setNewPassword('');
              setConfirmPassword('');
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ],
      );
    } catch (err: any) {
      const msg = err?.message || 'No se pudo actualizar la contraseña.';
      showAlert('error', 'Error', msg);
    } finally {
      setLoading(false);
    }
  }, [newPassword, confirmPassword, showAlert, navigation, dispatch]);

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('HomeScreen');
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={goBack} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={20} color={THEME.primaryCyan} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cambiar contraseña</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexFill}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.flexFill}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.authBox}>
              <View style={styles.iconContainer}>
                <View style={styles.iconWrap}>
                  <Ionicons name="lock-closed-outline" size={42} color={THEME.primaryCyan} />
                </View>
                <Text style={styles.subtitle}>Seguridad de la cuenta</Text>
              </View>

              {user?.email ? (
                <Text style={styles.emailText} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}

              <Text style={styles.helperText}>
                Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
              </Text>

              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <AntDesign
                    name="lock"
                    size={20}
                    color={newFocused ? THEME.primaryCyan : THEME.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, newFocused && styles.inputFocused]}
                    placeholder="Nueva contraseña"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry={!newVisible}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    onFocus={() => setNewFocused(true)}
                    onBlur={() => setNewFocused(false)}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setNewVisible(v => !v)}
                    style={styles.eyeIcon}
                    disabled={loading}
                  >
                    <Feather name={newVisible ? 'eye' : 'eye-off'} size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <AntDesign
                    name="lock"
                    size={20}
                    color={confirmFocused ? THEME.primaryCyan : THEME.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, confirmFocused && styles.inputFocused]}
                    placeholder="Confirmar nueva contraseña"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry={!confirmVisible}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setConfirmVisible(v => !v)}
                    style={styles.eyeIcon}
                    disabled={loading}
                  >
                    <Feather name={confirmVisible ? 'eye' : 'eye-off'} size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.primaryBtnText}>ACTUALIZAR CONTRASEÑA</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={goBack} style={styles.cancelContainer} disabled={loading}>
                <Text style={styles.cancelLink}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={() => setAlert(a => ({ ...a, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: THEME.darkBg },
  flexFill: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 60, paddingHorizontal: 20 },
  headerArea: {
    paddingTop: 58,
    paddingHorizontal: 24,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,229,255,0.08)',
    backgroundColor: 'rgba(5,26,38,0.82)',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.26)',
    backgroundColor: 'rgba(0,229,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  authBox: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: THEME.glassBg,
    borderColor: THEME.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 28,
    marginTop: 24,
  },
  iconContainer: { alignItems: 'center', marginBottom: 18 },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: THEME.primaryCyan,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  emailText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  helperText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 18,
  },
  inputGroup: { marginBottom: 16 },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 2 },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 48,
    paddingRight: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  inputFocused: {
    borderColor: THEME.primaryCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  eyeIcon: { position: 'absolute', right: 14, zIndex: 2, padding: 8 },
  primaryBtn: {
    paddingVertical: 15,
    backgroundColor: THEME.primaryCyan,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: THEME.primaryCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 13, letterSpacing: 1.8 },
  cancelContainer: { alignItems: 'center', marginTop: 16 },
  cancelLink: { color: THEME.primaryCyan, fontSize: 12, fontWeight: '600' },
});

export default ChangePasswordScreen;