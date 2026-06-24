import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, Image,
  Animated, ScrollView, KeyboardAvoidingView, Keyboard, Platform,
  TouchableWithoutFeedback, ActivityIndicator, BackHandler,
} from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { supabase, setPasswordRecoveryInProgress } from '@/config/SupabaseConfig';

type Props = NativeStackScreenProps<any>;

const THEME = {
  darkBg: '#01060a',
  primaryNavy: '#04273a',
  primaryCyan: '#15e5e9',
  textMain: '#ffffff',
  textMuted: '#8aa1b1',
  glassBg: 'rgba(4, 39, 58, 0.15)',
  glassBorder: 'rgba(21, 229, 233, 0.2)',
  errorColor: '#E91E63',
};

type AlertState = {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  buttons: AlertButton[];
};

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = (route?.params || {}) as {
    accessToken?: string;
    refreshToken?: string;
    code?: string;
    type?: string;
  };

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const completedRef = useRef(false);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const keyboardOffsetAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const showAlert = useCallback(
    (type: AlertState['type'], title: string, message: string, buttons?: AlertButton[]) => {
      setAlert({
        visible: true,
        type,
        title,
        message,
        buttons: buttons || [{ text: 'OK', onPress: () => setAlert(a => ({ ...a, visible: false })) }],
      });
    },
    [],
  );

  // Establecer la sesión con los tokens del deep link
  useEffect(() => {
    let cancelled = false;
    // Marca el flujo como recuperación para que el listener global de auth no
    // marque al usuario como autenticado (evita el cambio de stack del navegador).
    setPasswordRecoveryInProgress(true);
    (async () => {
      try {
        if (params.code) {
          // Flujo PKCE: intercambiamos el ?code= del enlace por una sesión.
          // (El SDK usa el code_verifier que guardó al pedir el reset.)
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) {
            // El code pudo consumirse ya (p.ej. doble entrega del deep link).
            // Si la sesión quedó establecida, continuamos igualmente.
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              if (!cancelled) setSessionReady(true);
              return;
            }
            throw error;
          }
          if (!cancelled) setSessionReady(true);
        } else if (params.accessToken && params.refreshToken) {
          // Flujo implícito (fallback): tokens en el fragmento del enlace.
          const { error } = await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken,
          });
          if (error) throw error;
          if (!cancelled) setSessionReady(true);
        } else {
          // Sin code ni tokens: puede que el usuario ya esté autenticado (caso "cambiar clave")
          const { data } = await supabase.auth.getSession();
          if (!cancelled) {
            if (data.session) {
              setSessionReady(true);
            } else {
              setSessionError(
                'Enlace inválido o expirado. Solicita un nuevo correo de recuperación.',
              );
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setSessionError(err?.message || 'No se pudo validar el enlace de recuperación.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.code, params.accessToken, params.refreshToken]);

  // Al desmontar la pantalla, liberar el flag de recuperación. Si el usuario
  // abandonó sin actualizar la clave, cerramos la sesión temporal para que no
  // quede autenticado en el próximo arranque.
  useEffect(() => {
    return () => {
      setPasswordRecoveryInProgress(false);
      if (!completedRef.current) {
        supabase.auth.signOut().catch(() => {});
      }
    };
  }, []);

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  // Levantar contenido con teclado (mismo patrón que LoginScreen)
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardOffsetAnim, {
        toValue: -28,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardOffsetAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffsetAnim]);

  // Bloquear back físico para no perder el flow
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Login' as never);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [navigation]),
  );

  const handleSubmit = useCallback(async () => {
    if (!sessionReady) {
      showAlert('error', 'Error', sessionError || 'Sesión de recuperación no válida.');
      return;
    }
    if (!password || password.length < 6) {
      showAlert('error', 'Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('error', 'Error', 'Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      completedRef.current = true;
      // Cierra la sesión temporal para forzar nuevo login con la nueva clave
      await supabase.auth.signOut();
      showAlert('success', 'Listo', 'Tu contraseña fue actualizada. Inicia sesión.', [
        {
          text: 'OK',
          onPress: () => {
            setAlert(a => ({ ...a, visible: false }));
            navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
          },
        },
      ]);
    } catch (err: any) {
      showAlert('error', 'Error', err?.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, sessionReady, sessionError, showAlert, navigation]);

  return (
    <ImageBackground
      source={require('@/assets/images/login.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexFill}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.flexFill}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [
                    { translateY: Animated.add(slideAnim, keyboardOffsetAnim) },
                  ],
                  opacity: opacityAnim,
                },
              ]}
            >
              <View style={styles.authBox}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoImageWrap}>
                    <Image
                      source={require('@/assets/images/logo-Preview.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.logoSubtitle}>Restablecer Contraseña</Text>
                </View>

                {sessionError ? (
                  <Text style={styles.errorText}>{sessionError}</Text>
                ) : null}

                <Text style={styles.helperText}>
                  Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
                </Text>

                {/* Nueva contraseña */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <AntDesign
                      name="lock"
                      size={20}
                      color={passwordFocused ? THEME.primaryCyan : THEME.textMuted}
                      style={styles.inputIcon}
                    />
                    {passwordFocused && <Text style={styles.plusIcon}>+</Text>}
                    <TextInput
                      style={[styles.input, passwordFocused && styles.inputFocused]}
                      placeholder="Nueva contraseña"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      secureTextEntry={!passwordVisible}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      editable={!loading && sessionReady}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setPasswordVisible(v => !v)}
                      style={styles.eyeIcon}
                      disabled={loading}
                    >
                      <Feather name={passwordVisible ? 'eye' : 'eye-off'} size={18} color="#fff" />
                    </TouchableOpacity>
                    {passwordFocused && <View style={styles.scanLine} />}
                  </View>
                </View>

                {/* Confirmar contraseña */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <AntDesign
                      name="lock"
                      size={20}
                      color={confirmFocused ? THEME.primaryCyan : THEME.textMuted}
                      style={styles.inputIcon}
                    />
                    {confirmFocused && <Text style={styles.plusIcon}>+</Text>}
                    <TextInput
                      style={[styles.input, confirmFocused && styles.inputFocused]}
                      placeholder="Confirmar contraseña"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      secureTextEntry={!confirmVisible}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setConfirmFocused(true)}
                      onBlur={() => setConfirmFocused(false)}
                      editable={!loading && sessionReady}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setConfirmVisible(v => !v)}
                      style={styles.eyeIcon}
                      disabled={loading}
                    >
                      <Feather name={confirmVisible ? 'eye' : 'eye-off'} size={18} color="#fff" />
                    </TouchableOpacity>
                    {confirmFocused && <View style={styles.scanLine} />}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (loading || !sessionReady) && styles.primaryBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading || !sessionReady}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.primaryBtnText}>ACTUALIZAR CONTRASEÑA</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] })}
                  style={styles.backContainer}
                  disabled={loading}
                >
                  <Text style={styles.backLink}>Volver a iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: THEME.darkBg },
  flexFill: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 120 },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  authBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.glassBg,
    borderColor: THEME.glassBorder,
    borderWidth: 1.5,
    borderRadius: 28,
    padding: 40,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
    elevation: 10,
  },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoImageWrap: {
    width: 120,
    height: 120,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(21, 229, 233, 0.35)',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  logoImage: { width: '100%', height: '100%' },
  logoSubtitle: {
    fontSize: 11,
    color: THEME.primaryCyan,
    fontWeight: '500',
    letterSpacing: 1.5,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  helperText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  errorText: {
    color: THEME.errorColor,
    fontSize: 13,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: { marginBottom: 20 },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 2 },
  plusIcon: {
    position: 'absolute',
    left: 10,
    top: 4,
    fontSize: 18,
    fontWeight: '900',
    color: THEME.primaryCyan,
    zIndex: 3,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 50,
    paddingRight: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  inputFocused: { borderColor: THEME.primaryCyan, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  eyeIcon: { position: 'absolute', right: 14, zIndex: 2, padding: 8 },
  scanLine: {
    position: 'absolute',
    bottom: 0,
    left: '5%',
    right: '5%',
    height: 2,
    backgroundColor: THEME.primaryCyan,
    borderRadius: 1,
  },
  primaryBtn: {
    paddingVertical: 15,
    backgroundColor: THEME.primaryCyan,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: THEME.primaryCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 13, letterSpacing: 1.8 },
  backContainer: { alignItems: 'center', marginTop: 16 },
  backLink: { color: THEME.primaryCyan, fontSize: 12, fontWeight: '600' },
});

export default ResetPasswordScreen;
