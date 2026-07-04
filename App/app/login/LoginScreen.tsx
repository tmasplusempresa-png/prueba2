import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, Image,
  Animated, ScrollView, KeyboardAvoidingView, Keyboard, Modal, FlatList,
  BackHandler, Platform, TouchableWithoutFeedback, Vibration, ActivityIndicator, Linking
} from "react-native";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { AntDesign, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { login } from "@/common/reducers/authReducer";
import { validateEmailFormat, validatePhoneFormat, extractPhoneDigits, normalizeEmail } from '@/common/utils/validators';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { usePhoneValidation } from '@/hooks/usePhoneValidation';
import { useAuth } from '@/hooks/useAuth';
import { clearStoredSession, supabase } from '@/config/SupabaseConfig';
import * as ExpoLinking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

const REMEMBER_ME_STORAGE_KEY = 'tmasplus_remember_me';

type Props = NativeStackScreenProps<any>;

const THEME = {
  darkBg: '#01060a',
  darkerBg: '#000305',
  primaryNavy: '#04273a',
  primaryCyan: '#15e5e9',
  textMain: '#ffffff',
  textMuted: '#8aa1b1',
  glassBg: 'rgba(4, 39, 58, 0.15)',
  glassBorder: 'rgba(21, 229, 233, 0.2)',
  errorColor: '#E91E63',
};

const COUNTRIES = [
  { code: '+57', flag: '🇨🇴', name: 'Colombia', dialCode: '+57' },
  { code: '+1', flag: '🇺🇸', name: 'Estados Unidos', dialCode: '+1' },
  { code: '+44', flag: '🇬🇧', name: 'Reino Unido', dialCode: '+44' },
  { code: '+56', flag: '🇨🇱', name: 'Chile', dialCode: '+56' },
  { code: '+55', flag: '🇧🇷', name: 'Brasil', dialCode: '+55' },
  { code: '+34', flag: '🇪🇸', name: 'España', dialCode: '+34' },
];

const USER_TYPE_OPTIONS = [
  { value: 'driver', label: 'Conductor', icon: 'car' },
  { value: 'customer', label: 'Cliente', icon: 'user' },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'PA', label: 'Pasaporte (PA)' },
  { value: 'NIT', label: 'NIT' },
  { value: 'RC', label: 'Registro Civil (RC)' },
];

const USER_TYPE_ITEM_HEIGHT = 58;

// ============ MAIN COMPONENT ============
const LoginScreen = ({ navigation }: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const userTypeWheelRef = useRef<ScrollView>(null);
  const dispatch = useDispatch();
  
  // Custom Hooks
  const { login: loginUser, signup: signupUser } = useAuth();

  // Form State
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    mobile: "",
    usertype: "",
    documentType: "",
    documentNumber: "",
    referralCode: "",
  });

  const [documentTypeModalVisible, setDocumentTypeModalVisible] = useState(false);

  // UI State
  const [ui, setUI] = useState({
    loading: false,
    error: "",
    passwordVisible: false,
    confirmPasswordVisible: false,
    isLoginMode: true,
    emailFocused: false,
    passwordFocused: false,
    confirmPasswordFocused: false,
    firstNameFocused: false,
    lastNameFocused: false,
    phoneFocused: false,
    documentNumberFocused: false,
    referralCodeFocused: false,
  });

  // Country & Modals State
  const [country, setCountry] = useState({
    selectedCountry: COUNTRIES[0],
    countryCode: "+57",
    showModal: false,
  });

  const [userTypeState, setUserTypeState] = useState({
    showModal: false,
    wheelIndex: 0,
  });

  // Validation State
  const [validation, setValidation] = useState({
    emailFormatValid: true,
    phoneFormatValid: true,
    emailExists: false,
    phoneExists: false,
    rememberMe: false,
    acceptTerms: false,
    acceptDataTreatment: false,
    acceptPrivacyPolicy: false,
  });

  // Alert State
  const [alert, setAlert] = useState({
    visible: false,
    type: "error" as any,
    title: "",
    message: "",
    buttons: [] as AlertButton[]
  });

  // Validation Hooks - solo activos en modo registro
  const emailValidation = useEmailValidation(
    form.email,
    validation.emailFormatValid,
    !ui.isLoginMode
  );
  const phoneValidation = usePhoneValidation(
    form.mobile,
    validation.phoneFormatValid,
    country.countryCode,
    !ui.isLoginMode
  );

  // Animations
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const keyboardOffsetAnim = useRef(new Animated.Value(0)).current;
  const passwordLiftAnim = useRef(new Animated.Value(0)).current;

  // ============ UTIL FUNCTIONS ============
  const updateField = useCallback((key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const sanitizeInput = useCallback((input: string, type: 'text' | 'email' | 'phone' = 'text'): string => {
    if (!input) return '';
    let sanitized = input.trim();
    switch (type) {
      case 'email':
        sanitized = sanitized.toLowerCase().replace(/\s+/g, '');
        break;
      case 'phone':
        sanitized = sanitized.replace(/\D/g, '');
        break;
      case 'text':
        sanitized = sanitized.replace(/[<>{}[\]\\]/g, '').replace(/\s+/g, ' ').trim();
        break;
    }
    return sanitized;
  }, []);

  const showAlert = useCallback((type: any, title: string, message: string, buttons?: AlertButton[]) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      buttons: buttons || [{ text: "OK", onPress: () => setAlert(a => ({ ...a, visible: false })) }]
    });
  }, []);

  const clearRegistrationForm = useCallback(() => {
    setForm({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      mobile: "",
      usertype: "",
      documentType: "",
      documentNumber: "",
      referralCode: "",
    });
    setValidation(prev => ({
      ...prev,
      emailExists: false,
      phoneExists: false,
      acceptTerms: false,
      acceptDataTreatment: false,
      acceptPrivacyPolicy: false,
    }));
    setUI(prev => ({ ...prev, error: "" }));
  }, []);

  const allRequiredAccepted =
    validation.acceptTerms &&
    validation.acceptDataTreatment &&
    validation.acceptPrivacyPolicy;

  const handleReviewLink = useCallback(async () => {
    const url = 'https://tmasplus.com/tratamiento-de-datos';
    try {
      await Linking.openURL(url);
    } catch {
      showAlert('error', 'Error', 'No se pudo abrir el enlace de revisión.');
    }
  }, [showAlert]);

  // ============ HANDLERS - LOGIN ============
  const handleLogin = useCallback(async () => {
    if (!form.email || !form.password) {
      setUI(u => ({ ...u, error: "Completa todos los campos" }));
      return;
    }

    setUI(u => ({ ...u, loading: true, error: "" }));
    try {
      const normalizedEmail = normalizeEmail(form.email);
      const user = await loginUser({
        email: normalizedEmail,
        password: form.password,
      });

      try {
        if (validation.rememberMe) {
          await SecureStore.setItemAsync(
            REMEMBER_ME_STORAGE_KEY,
            JSON.stringify({ email: normalizedEmail, password: form.password })
          );
        } else {
          await SecureStore.deleteItemAsync(REMEMBER_ME_STORAGE_KEY);
        }
      } catch (storageErr) {
        console.warn('[LoginScreen] No se pudo persistir Recordarme:', storageErr);
      }

      dispatch(login(user));
    } catch (e: any) {
      setUI(u => ({ ...u, error: e.message }));
      showAlert("error", "Error", e.message);
    } finally {
      setUI(u => ({ ...u, loading: false }));
    }
  }, [form.email, form.password, validation.rememberMe, loginUser, dispatch, showAlert]);

  // ============ HANDLERS - SIGNUP ============
  const handleSignUp = useCallback(async () => {
    const sanitizedFirstName = sanitizeInput(form.firstName, 'text');
    const sanitizedLastName = sanitizeInput(form.lastName, 'text');
    const sanitizedEmail = sanitizeInput(form.email, 'email');
    const sanitizedMobile = sanitizeInput(form.mobile, 'phone');
    const sanitizedDocumentNumber = (form.documentNumber || '').replace(/[^0-9A-Za-z-]/g, '').trim();
    const sanitizedReferralCode = (form.referralCode || '').trim();

    if (
      !sanitizedFirstName ||
      !sanitizedLastName ||
      !sanitizedEmail ||
      !sanitizedMobile ||
      !form.usertype ||
      !form.documentType ||
      !sanitizedDocumentNumber ||
      !form.password ||
      !form.confirmPassword
    ) {
      showAlert('error', 'Error', 'Por favor completa todos los campos correctamente');
      return;
    }

    if (form.password.length < 6) {
      showAlert('error', 'Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (form.password !== form.confirmPassword) {
      showAlert('error', 'Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!allRequiredAccepted) {
      showAlert('error', 'Error', 'Debes aceptar términos, tratamiento de datos y política de privacidad');
      return;
    }

    if (validation.emailExists) {
      showAlert('error', 'Error', 'Este correo ya está registrado. Intenta iniciar sesión.');
      return;
    }

    if (validation.phoneExists) {
      showAlert('error', 'Error', 'Este teléfono ya está registrado.');
      return;
    }

    setUI(u => ({ ...u, loading: true, error: "" }));
    try {
      const result = await signupUser({
        email: sanitizedEmail,
        password: form.password,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        phone: `${country.countryCode}${sanitizedMobile}`,
        usertype: form.usertype,
        documentType: form.documentType,
        documentNumber: sanitizedDocumentNumber,
        referredByCode: sanitizedReferralCode || undefined,
      });

      console.log('✅ [handleSignUp] signupUser resolvió:', result);

      const goToLogin = () => {
        setAlert(a => ({ ...a, visible: false }));
        setUI(u => ({ ...u, isLoginMode: true }));
      };

      if (result?.alreadyExists) {
        showAlert(
          'info',
          'Correo ya registrado',
          `El correo ${sanitizedEmail} ya tiene una cuenta. Si aún no la confirmaste, revisa tu bandeja de entrada (y spam) y abre el enlace que te enviamos. Si ya la confirmaste, inicia sesión.`,
          [{ text: 'Entendido', onPress: goToLogin }]
        );
      } else if (result?.requiresConfirmation) {
        showAlert(
          'success',
          '¡Registro Exitoso!',
          `Bienvenido ${sanitizedFirstName}! Te enviamos un email de confirmación a ${sanitizedEmail}. Debes activar la cuenta desde el enlace en tu correo antes de iniciar sesión. Si no lo ves, revisa la carpeta de spam.`,
          [{ text: 'Entendido', onPress: goToLogin }]
        );
      } else {
        showAlert(
          'success',
          '¡Registro Exitoso!',
          `Bienvenido ${sanitizedFirstName}! Tu cuenta ya está activa, ahora puedes iniciar sesión.`,
          [{ text: 'Entendido', onPress: goToLogin }]
        );
      }

      // Limpiamos la sesión local DESPUÉS de programar el alert para que la
      // recursión del listener nunca pueda cancelarlo.
      if (result?.requiresConfirmation || result?.alreadyExists) {
        clearStoredSession().catch(err =>
          console.warn('[handleSignUp] clearStoredSession error:', err?.message)
        );
      }

      // Limpiar formulario
      setForm(prev => ({
        ...prev,
        email: sanitizedEmail,
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        mobile: '',
        usertype: '',
        documentType: '',
        documentNumber: '',
        referralCode: '',
      }));
      setValidation(v => ({
        ...v,
        emailExists: false,
        phoneExists: false,
        acceptTerms: false,
        acceptDataTreatment: false,
        acceptPrivacyPolicy: false,
      }));
      setUI(u => ({ ...u, loading: false, error: '' }));
    } catch (e: any) {
      let errorMessage = e.message || 'Error al registrarse';
      const lower = errorMessage.toLowerCase();

      // Manejo de errores específicos de Supabase
      if (lower.includes('rate limit')) {
        errorMessage = 'Demasiados intentos de registro. Espera unos minutos e intenta de nuevo.';
      } else if (lower.includes('is invalid')) {
        errorMessage = 'El correo electrónico no es válido. Verifica que sea correcto.';
      } else if (lower.includes('already exists') || lower.includes('already registered')) {
        errorMessage = 'Este correo ya está registrado. Intenta iniciar sesión.';
      } else if (lower.includes('database error saving new user')) {
        // El trigger handle_new_user falló (lo más común: número de documento duplicado
        // por el UNIQUE INDEX idx_users_document_unique, o email duplicado en public.users).
        errorMessage = 'No se pudo completar el registro. Es posible que el número de documento ya esté en uso. Verifica tus datos e intenta de nuevo.';
      }

      showAlert('error', 'Error de Registro', errorMessage);
    } finally {
      setUI(u => ({ ...u, loading: false }));
    }
  }, [form, country.countryCode, allRequiredAccepted, validation.emailExists, validation.phoneExists, sanitizeInput, signupUser, showAlert, clearRegistrationForm, updateField]);

  // ============ HANDLERS - INPUT CHANGES ============
  const handleEmailChange = useCallback((text: string) => {
    const sanitized = sanitizeInput(text, 'email');
    const normalized = normalizeEmail(sanitized);
    updateField('email', normalized);
    setValidation(v => ({
      ...v,
      emailFormatValid: normalized ? validateEmailFormat(normalized) : true,
      emailExists: false,
    }));
  }, [sanitizeInput, updateField]);

  const handlePhoneChange = useCallback((text: string) => {
    const sanitized = sanitizeInput(text, 'phone');
    const digits = extractPhoneDigits(sanitized);
    updateField('mobile', digits);
    setValidation(v => ({
      ...v,
      phoneFormatValid: digits ? validatePhoneFormat(digits) : true,
      phoneExists: false,
    }));
  }, [sanitizeInput, updateField]);

  const handleFirstNameChange = useCallback((text: string) => {
    updateField('firstName', sanitizeInput(text, 'text'));
  }, [sanitizeInput, updateField]);

  const handleLastNameChange = useCallback((text: string) => {
    updateField('lastName', sanitizeInput(text, 'text'));
  }, [sanitizeInput, updateField]);

  const handlePasswordReset = useCallback(async () => {
    const email = normalizeEmail(form.email);
    if (!email) {
      showAlert('error', 'Error', 'Ingresa tu correo electrónico');
      return;
    }
    if (!validateEmailFormat(email)) {
      showAlert('error', 'Error', 'El correo no tiene un formato válido');
      return;
    }
    try {
      const redirectTo = ExpoLinking.createURL('reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      showAlert('success', 'Enviado', 'Revisa tu email para el enlace de reseteo');
    } catch (err: any) {
      showAlert('error', 'Error', err?.message || 'No se pudo enviar el correo de reseteo');
    }
  }, [form.email, showAlert]);

  // ============ USERTYPE WHEEL ============
  const updateUserTypeFromIndex = useCallback((index: number, triggerVibration = true) => {
    const safeIndex = Math.min(Math.max(index, 0), USER_TYPE_OPTIONS.length - 1);
    const selectedOption = USER_TYPE_OPTIONS[safeIndex];
    setUserTypeState(s => ({ ...s, wheelIndex: safeIndex }));
    if (selectedOption.value !== form.usertype) {
      updateField('usertype', selectedOption.value);
      if (triggerVibration) Vibration.vibrate(12);
    }
  }, [form.usertype, updateField]);

  // ============ ANIMATION EFFECTS ============
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  // Recordarme: precargar email/contraseña guardados en arranques previos.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(REMEMBER_ME_STORAGE_KEY);
        if (!raw || cancelled) return;
        const saved = JSON.parse(raw) as { email?: string; password?: string };
        if (!saved?.email) return;
        setForm(prev => ({
          ...prev,
          email: saved.email || prev.email,
          password: saved.password || prev.password,
        }));
        setValidation(v => ({ ...v, rememberMe: true }));
      } catch (err) {
        console.warn('[LoginScreen] No se pudo leer Recordarme:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Deep link → ResetPassword. Maneja URLs tipo
  // tmasplus://reset-password#access_token=...&refresh_token=...&type=recovery
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      try {
        const parsed = ExpoLinking.parse(url);
        // 'reset-password' puede quedar como hostname (tmasplus://reset-password)
        // o como path, según cómo expo-linking interprete la URL. Revisamos ambos.
        const host = (parsed.hostname || '').replace(/^\/+/, '');
        const path = (parsed.path || '').replace(/^\/+/, '');
        // PKCE manda ?code= en el query; el flujo implícito manda los tokens en
        // el fragmento (#). Leemos de ambos por robustez.
        const qp = (parsed.queryParams || {}) as Record<string, string | undefined>;
        const fragment = url.includes('#') ? url.split('#')[1] : '';
        const fragmentParams: Record<string, string> = {};
        if (fragment) {
          fragment.split('&').forEach(part => {
            const [k, v] = part.split('=');
            if (k) fragmentParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
          });
        }
        const code = qp.code || fragmentParams.code;
        const accessToken = qp.access_token || fragmentParams.access_token;
        const refreshToken = qp.refresh_token || fragmentParams.refresh_token;
        const type = qp.type || fragmentParams.type;
        const isReset =
          host.includes('reset-password') ||
          path.includes('reset-password') ||
          type === 'recovery' ||
          !!accessToken ||
          !!code;
        if (isReset) {
          (navigation as any).navigate('ResetPassword', {
            accessToken,
            refreshToken,
            code,
            type,
          });
        }
      } catch (e) {
        console.warn('Deep link parse error:', e);
      }
    };

    ExpoLinking.getInitialURL().then(handleUrl);
    const sub = ExpoLinking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [navigation]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardOffsetAnim, { toValue: -18, duration: 220, useNativeDriver: true }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardOffsetAnim, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, [keyboardOffsetAnim]);

  useEffect(() => {
    let liftValue = 0;
    if (ui.confirmPasswordFocused) liftValue = -58;
    else if (ui.passwordFocused) liftValue = -34;
    Animated.timing(passwordLiftAnim, {
      toValue: liftValue,
      duration: liftValue === 0 ? 220 : 180,
      useNativeDriver: true,
    }).start();
  }, [ui.passwordFocused, ui.confirmPasswordFocused, passwordLiftAnim]);

  useEffect(() => {
    if (!userTypeState.showModal) return;
    const index = Math.max(0, USER_TYPE_OPTIONS.findIndex(o => o.value === form.usertype));
    setUserTypeState(s => ({ ...s, wheelIndex: index }));
    requestAnimationFrame(() => {
      userTypeWheelRef.current?.scrollTo({ y: index * USER_TYPE_ITEM_HEIGHT, animated: false });
    });
  }, [userTypeState.showModal, form.usertype]);

  useEffect(() => {
    setValidation(v => ({ ...v, emailExists: emailValidation.exists }));
  }, [emailValidation.exists]);

  useEffect(() => {
    setValidation(v => ({ ...v, phoneExists: phoneValidation.exists }));
  }, [phoneValidation.exists]);

  // Back Handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [])
  );

  // ============ RENDER ============
  return (
    <ImageBackground 
      source={require("@/assets/images/login.jpg")} 
      resizeMode="cover" 
      style={styles.background}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexFill}>
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
                    {
                      translateY: Animated.add(
                        Animated.add(slideAnim, keyboardOffsetAnim),
                        passwordLiftAnim
                      ),
                    },
                  ],
                  opacity: opacityAnim,
                },
              ]}
            >
              <View style={styles.authBox}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                  <View style={styles.logoImageWrap}>
                    <Image
                      source={require("@/assets/images/logo-Preview.png")}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.logoSubtitle}>Movilidad Inteligente</Text>
                </View>

                {/* Toggle */}
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, ui.isLoginMode && styles.toggleBtnActive]}
                    onPress={() => setUI(u => ({ ...u, isLoginMode: true, error: "" }))}
                  >
                    <Text style={[styles.toggleBtnText, ui.isLoginMode && styles.toggleBtnTextActive]}>Ingresar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, !ui.isLoginMode && styles.toggleBtnActive]}
                    onPress={() => setUI(u => ({ ...u, isLoginMode: false, error: "" }))}
                  >
                    <Text style={[styles.toggleBtnText, !ui.isLoginMode && styles.toggleBtnTextActive]}>Registro</Text>
                  </TouchableOpacity>
                </View>

                {/* Error */}
                {ui.error ? <Text style={styles.errorText}>{ui.error}</Text> : null}

                {/* LOGIN FORM */}
                {ui.isLoginMode ? (
                  <View>
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <Feather name="user" size={20} color={ui.emailFocused ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                        {ui.emailFocused && <Text style={styles.plusIcon}>+</Text>}
                        <TextInput
                          style={[styles.input, ui.emailFocused && styles.inputFocused]}
                          placeholder="Email"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="email-address"
                          value={form.email}
                          onChangeText={handleEmailChange}
                          onFocus={() => setUI(u => ({ ...u, emailFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, emailFocused: false }))}
                          editable={!ui.loading}
                          autoCapitalize="none"
                        />
                        {ui.emailFocused && <View style={styles.scanLine} />}
                      </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <AntDesign name="lock" size={20} color={ui.passwordFocused ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                        {ui.passwordFocused && <Text style={styles.plusIcon}>+</Text>}
                        <TextInput
                          style={[styles.input, ui.passwordFocused && styles.inputFocused]}
                          placeholder="Contraseña"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          secureTextEntry={!ui.passwordVisible}
                          value={form.password}
                          onChangeText={(t) => updateField('password', t)}
                          onFocus={() => setUI(u => ({ ...u, passwordFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, passwordFocused: false }))}
                          editable={!ui.loading}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setUI(u => ({ ...u, passwordVisible: !u.passwordVisible }))} style={styles.eyeIcon} disabled={ui.loading}>
                          <Feather name={ui.passwordVisible ? "eye" : "eye-off"} size={18} color="#fff" />
                        </TouchableOpacity>
                        {ui.passwordFocused && <View style={styles.scanLine} />}
                      </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity style={[styles.primaryBtn, ui.loading && styles.primaryBtnDisabled]} onPress={handleLogin} disabled={ui.loading}>
                      {ui.loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>INICIAR SESIÓN</Text>}
                    </TouchableOpacity>

                    {/* Remember Me */}
                    <View style={styles.rememberMeContainer}>
                      <TouchableOpacity style={styles.checkboxRow} onPress={() => setValidation(v => ({ ...v, rememberMe: !v.rememberMe }))} disabled={ui.loading}>
                        <View style={[styles.checkbox, validation.rememberMe && styles.checkboxActive]}>
                          {validation.rememberMe && <AntDesign name="check" size={12} color="#fff" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Recordarme</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity onPress={handlePasswordReset} disabled={ui.loading} style={styles.forgotPasswordContainer}>
                      <Text style={styles.forgotLink}>¿Olvidaste tu clave?</Text>
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <TouchableOpacity onPress={() => setUI(u => ({ ...u, isLoginMode: false }))}>
                      <Text style={styles.signUpLinkText}>¿No tienes cuenta? <Text style={styles.signUpLinkHighlight}>Regístrate</Text></Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // SIGNUP FORM
                  <View>
                    {/* First Name */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <Feather name="user" size={20} color={ui.firstNameFocused ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                        {ui.firstNameFocused && <Text style={styles.plusIcon}>+</Text>}
                        <TextInput
                          style={[styles.input, ui.firstNameFocused && styles.inputFocused]}
                          placeholder="Nombre"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={form.firstName}
                          onChangeText={handleFirstNameChange}
                          onFocus={() => setUI(u => ({ ...u, firstNameFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, firstNameFocused: false }))}
                          editable={!ui.loading}
                          autoCapitalize="words"
                        />
                        {ui.firstNameFocused && <View style={styles.scanLine} />}
                      </View>
                    </View>

                    {/* Last Name */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <Feather name="user" size={20} color={ui.lastNameFocused ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                        {ui.lastNameFocused && <Text style={styles.plusIcon}>+</Text>}
                        <TextInput
                          style={[styles.input, ui.lastNameFocused && styles.inputFocused]}
                          placeholder="Apellido"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={form.lastName}
                          onChangeText={handleLastNameChange}
                          onFocus={() => setUI(u => ({ ...u, lastNameFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, lastNameFocused: false }))}
                          editable={!ui.loading}
                          autoCapitalize="words"
                        />
                        {ui.lastNameFocused && <View style={styles.scanLine} />}
                      </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="email" size={20} color={ui.emailFocused ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                        {ui.emailFocused && <Text style={styles.plusIcon}>+</Text>}
                        <TextInput
                          style={[styles.input, ui.emailFocused && styles.inputFocused]}
                          placeholder="Email"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="email-address"
                          value={form.email}
                          onChangeText={handleEmailChange}
                          onFocus={() => setUI(u => ({ ...u, emailFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, emailFocused: false }))}
                          editable={!ui.loading}
                          autoCapitalize="none"
                        />
                        {ui.emailFocused && <View style={styles.scanLine} />}
                      </View>
                    </View>
                    {emailValidation.isChecking ? (
                      <Text style={styles.statusText}>Comprobando correo...</Text>
                    ) : !validation.emailFormatValid && form.email ? (
                      <Text style={styles.errorSmall}>Formato de correo inválido</Text>
                    ) : validation.emailExists ? (
                      <Text style={styles.errorSmall}>Este correo ya está registrado</Text>
                    ) : null}

                    {/* Phone */}
                    <View style={styles.phoneContainer}>
                      <View style={[styles.inputWrapper, styles.phoneCombinedWrapper]}>
                        <TouchableOpacity style={styles.phoneCodeInlineButton} onPress={() => setCountry(c => ({ ...c, showModal: true }))}>
                          <Text style={styles.countryFlag}>{country.selectedCountry.flag}</Text>
                          <Text style={styles.countryCode}>{country.selectedCountry.code}</Text>
                          <MaterialCommunityIcons name="chevron-down" size={14} color={THEME.textMuted} />
                        </TouchableOpacity>
                        <TextInput
                          style={[styles.input, styles.phoneCombinedInput]}
                          placeholder="3005551234"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={form.mobile}
                          onChangeText={handlePhoneChange}
                          onFocus={() => setUI(u => ({ ...u, phoneFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, phoneFocused: false }))}
                          keyboardType="phone-pad"
                          maxLength={10}
                          editable={!ui.loading}
                        />
                      </View>
                    </View>
                    {phoneValidation.isChecking ? (
                      <Text style={styles.statusText}>Comprobando teléfono...</Text>
                    ) : !validation.phoneFormatValid && form.mobile ? (
                      <Text style={styles.errorSmall}>Formato de teléfono inválido</Text>
                    ) : validation.phoneExists ? (
                      <Text style={styles.errorSmall}>Este teléfono ya está registrado</Text>
                    ) : null}

                    {/* User Type */}
                    <TouchableOpacity style={[styles.inputGroup, styles.inputWrapper, styles.userTypeButton]} onPress={() => setUserTypeState(u => ({ ...u, showModal: true }))}>
                      <AntDesign name="idcard" size={20} color={form.usertype ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                      <Text style={[styles.input, { color: form.usertype ? THEME.textMain : THEME.textMuted }]}>
                        {form.usertype ? (form.usertype === 'driver' ? 'Conductor' : 'Cliente') : 'Soy...'}
                      </Text>
                    </TouchableOpacity>

                    {/* Document Type */}
                    <TouchableOpacity
                      style={[styles.inputGroup, styles.inputWrapper, styles.userTypeButton]}
                      onPress={() => setDocumentTypeModalVisible(true)}
                    >
                      <MaterialCommunityIcons name="file-document-outline" size={20} color={form.documentType ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                      <Text style={[styles.input, { color: form.documentType ? THEME.textMain : THEME.textMuted }]}>
                        {form.documentType
                          ? (DOCUMENT_TYPE_OPTIONS.find(o => o.value === form.documentType)?.label || form.documentType)
                          : 'Tipo de documento'}
                      </Text>
                    </TouchableOpacity>

                    {/* Document Number */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons
                          name="card-account-details-outline"
                          size={20}
                          color={ui.documentNumberFocused ? THEME.primaryCyan : THEME.textMuted}
                          style={styles.inputIcon}
                        />
                        {ui.documentNumberFocused && <Text style={styles.plusIcon}>+</Text>}
                        <TextInput
                          style={[styles.input, ui.documentNumberFocused && styles.inputFocused]}
                          placeholder="Número de documento"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={form.documentNumber}
                          onChangeText={(t) => updateField('documentNumber', t.replace(/[^0-9A-Za-z-]/g, ''))}
                          onFocus={() => setUI(u => ({ ...u, documentNumberFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, documentNumberFocused: false }))}
                          editable={!ui.loading}
                          keyboardType={form.documentType === 'PA' ? 'default' : 'number-pad'}
                          maxLength={20}
                          autoCapitalize="characters"
                        />
                        {ui.documentNumberFocused && <View style={styles.scanLine} />}
                      </View>
                    </View>

                    {/* Referral Code (opcional) */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <Feather
                          name="gift"
                          size={20}
                          color={ui.referralCodeFocused ? THEME.primaryCyan : THEME.textMuted}
                          style={styles.inputIcon}
                        />
                        {ui.referralCodeFocused && <Text style={styles.plusIcon}>+</Text>}
                        <TextInput
                          style={[styles.input, ui.referralCodeFocused && styles.inputFocused]}
                          placeholder="Código de referido (opcional)"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={form.referralCode}
                          onChangeText={(t) => updateField('referralCode', t.trim())}
                          onFocus={() => setUI(u => ({ ...u, referralCodeFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, referralCodeFocused: false }))}
                          editable={!ui.loading}
                          autoCapitalize="characters"
                          maxLength={32}
                        />
                        {ui.referralCodeFocused && <View style={styles.scanLine} />}
                      </View>
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <AntDesign name="lock" size={20} color={ui.passwordFocused ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                        {ui.passwordFocused && <Text style={styles.plusIcon}>+</Text>}
                        <TextInput
                          style={[styles.input, ui.passwordFocused && styles.inputFocused]}
                          placeholder="Contraseña"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          secureTextEntry={!ui.passwordVisible}
                          value={form.password}
                          onChangeText={(t) => updateField('password', t)}
                          onFocus={() => setUI(u => ({ ...u, passwordFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, passwordFocused: false }))}
                          editable={!ui.loading}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setUI(u => ({ ...u, passwordVisible: !u.passwordVisible }))} style={styles.eyeIcon} disabled={ui.loading}>
                          <Feather name={ui.passwordVisible ? "eye" : "eye-off"} size={18} color="#fff" />
                        </TouchableOpacity>
                        {ui.passwordFocused && <View style={styles.scanLine} />}
                      </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                      <View style={styles.inputWrapper}>
                        <AntDesign name="lock" size={20} color={ui.confirmPasswordFocused ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                        {ui.confirmPasswordFocused && <Text style={styles.plusIcon}>+</Text>}
                        <TextInput
                          style={[styles.input, ui.confirmPasswordFocused && styles.inputFocused]}
                          placeholder="Confirmar Contraseña"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          secureTextEntry={!ui.confirmPasswordVisible}
                          value={form.confirmPassword}
                          onChangeText={(t) => updateField('confirmPassword', t)}
                          onFocus={() => setUI(u => ({ ...u, confirmPasswordFocused: true }))}
                          onBlur={() => setUI(u => ({ ...u, confirmPasswordFocused: false }))}
                          editable={!ui.loading}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setUI(u => ({ ...u, confirmPasswordVisible: !u.confirmPasswordVisible }))} style={styles.eyeIcon} disabled={ui.loading}>
                          <Feather name={ui.confirmPasswordVisible ? "eye" : "eye-off"} size={18} color="#fff" />
                        </TouchableOpacity>
                        {ui.confirmPasswordFocused && <View style={styles.scanLine} />}
                      </View>
                    </View>

                    {/* Required Agreements */}
                    <View style={styles.agreementsCard}>
                      <TouchableOpacity style={styles.agreementsCheckboxRow} onPress={() => setValidation(v => ({ ...v, acceptTerms: !v.acceptTerms }))} disabled={ui.loading}>
                        <View style={[styles.checkbox, validation.acceptTerms && styles.checkboxActive]}>
                          {validation.acceptTerms && <AntDesign name="check" size={12} color="#fff" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Acepto Términos y Condiciones</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.agreementsCheckboxRow} onPress={() => setValidation(v => ({ ...v, acceptDataTreatment: !v.acceptDataTreatment }))} disabled={ui.loading}>
                        <View style={[styles.checkbox, validation.acceptDataTreatment && styles.checkboxActive]}>
                          {validation.acceptDataTreatment && <AntDesign name="check" size={12} color="#fff" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Acepto Tratamiento de Datos</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.agreementsCheckboxRow} onPress={() => setValidation(v => ({ ...v, acceptPrivacyPolicy: !v.acceptPrivacyPolicy }))} disabled={ui.loading}>
                        <View style={[styles.checkbox, validation.acceptPrivacyPolicy && styles.checkboxActive]}>
                          {validation.acceptPrivacyPolicy && <AntDesign name="check" size={12} color="#fff" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Acepto Política de Privacidad</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.learnMoreBtn} onPress={handleReviewLink} disabled={ui.loading}>
                        <Feather name="external-link" size={14} color={THEME.primaryCyan} />
                        <Text style={styles.learnMoreBtnText}>Leer más</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Signup Button */}
                    <TouchableOpacity style={[styles.primaryBtn, (ui.loading || !allRequiredAccepted) && styles.primaryBtnDisabled]} onPress={handleSignUp} disabled={ui.loading || !allRequiredAccepted}>
                      {ui.loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>CREAR CUENTA</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal visible={country.showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona país</Text>
              <TouchableOpacity onPress={() => setCountry(c => ({ ...c, showModal: false }))}>
                <AntDesign name="close" size={24} color={THEME.textMain} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryOption} onPress={() => setCountry(c => ({ ...c, selectedCountry: item, countryCode: item.code, showModal: false }))}>
                  <Text style={styles.countryOptionText}>{item.flag} {item.name} ({item.code})</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* User Type Modal */}
      <Modal visible={userTypeState.showModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, styles.userTypeModalOverlay]}>
          <View style={styles.userTypeModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Soy...</Text>
              <TouchableOpacity onPress={() => setUserTypeState(u => ({ ...u, showModal: false }))}>
                <AntDesign name="close" size={24} color={THEME.textMain} />
              </TouchableOpacity>
            </View>
            <View style={styles.userTypeWheelContainer}>
              <View pointerEvents="none" style={styles.userTypeWheelFocusRow} />
              <ScrollView
                ref={userTypeWheelRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={USER_TYPE_ITEM_HEIGHT}
                decelerationRate="fast"
                contentContainerStyle={styles.userTypeWheelContent}
                onMomentumScrollEnd={(event) => {
                  const offsetY = event.nativeEvent.contentOffset.y;
                  const nextIndex = Math.round(offsetY / USER_TYPE_ITEM_HEIGHT);
                  updateUserTypeFromIndex(nextIndex);
                }}
              >
                {USER_TYPE_OPTIONS.map((option, index) => {
                  const active = index === userTypeState.wheelIndex;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.userTypeWheelItem, active && styles.userTypeWheelItemActive]}
                      onPress={() => updateUserTypeFromIndex(index)}
                    >
                      <AntDesign name={option.icon as any} size={22} color={THEME.primaryCyan} />
                      <Text style={[styles.userTypeWheelText, active && styles.userTypeWheelTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Type Modal */}
      <Modal visible={documentTypeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de documento</Text>
              <TouchableOpacity onPress={() => setDocumentTypeModalVisible(false)}>
                <AntDesign name="close" size={24} color={THEME.textMain} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DOCUMENT_TYPE_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryOption}
                  onPress={() => {
                    updateField('documentType', item.value);
                    setDocumentTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.countryOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Alert */}
      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} buttons={alert.buttons} onDismiss={() => setAlert(a => ({ ...a, visible: false }))} />
    </ImageBackground>
  );
};

// Styles
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: THEME.darkBg },
  flexFill: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 120 },
  container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 20, paddingTop: 80 },
  authBox: {
    width: '100%', maxWidth: 420, backgroundColor: THEME.glassBg, borderColor: THEME.glassBorder,
    borderWidth: 1.5, borderRadius: 28, padding: 40, marginTop: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 }, shadowOpacity: 0.6, shadowRadius: 60, elevation: 10
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
  logoTitle: { fontSize: 32, fontWeight: '800', color: THEME.textMain, letterSpacing: -0.5 },
  logoSubtitle: { fontSize: 11, color: THEME.primaryCyan, fontWeight: '500', letterSpacing: 1.5, marginTop: 5, textTransform: 'uppercase' },
  toggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 14, padding: 6, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: 'rgba(21, 229, 233, 0.15)', shadowColor: THEME.primaryCyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  toggleBtnText: { color: THEME.textMuted, fontWeight: '600', fontSize: 14 },
  toggleBtnTextActive: { color: THEME.textMain },
  errorText: { color: THEME.errorColor, fontSize: 13, marginBottom: 15, textAlign: 'center', fontWeight: '500' },
  inputGroup: { marginBottom: 20 },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 2 },
  plusIcon: { position: 'absolute', left: 10, top: 4, fontSize: 18, fontWeight: '900', color: THEME.primaryCyan, zIndex: 3 },
  input: { flex: 1, paddingVertical: 16, paddingHorizontal: 16, paddingLeft: 50, paddingRight: 40, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 14, color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  inputFocused: { borderColor: THEME.primaryCyan, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  eyeIcon: { position: 'absolute', right: 14, zIndex: 2, padding: 8 },
  scanLine: { position: 'absolute', bottom: 0, left: '5%', right: '5%', height: 2, backgroundColor: THEME.primaryCyan, borderRadius: 1 },
  rememberMeContainer: { alignItems: 'center', marginTop: 14, marginBottom: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  agreementsCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(21, 229, 233, 0.2)',
    backgroundColor: 'rgba(4, 39, 58, 0.22)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  agreementsCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    width: '100%',
  },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(21, 229, 233, 0.5)', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  checkboxActive: { backgroundColor: THEME.primaryCyan, borderColor: THEME.primaryCyan },
  checkboxLabel: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 12, fontWeight: '500' },
  learnMoreBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(21, 229, 233, 0.45)',
    backgroundColor: 'rgba(21, 229, 233, 0.1)',
  },
  learnMoreBtnText: { color: THEME.primaryCyan, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  forgotPasswordContainer: { alignItems: 'center', marginTop: 12 },
  forgotLink: { color: THEME.primaryCyan, fontSize: 12, fontWeight: '600' },
  signUpLinkText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 16 },
  signUpLinkHighlight: { color: THEME.primaryCyan, fontWeight: '700' },
  primaryBtn: { paddingVertical: 15, backgroundColor: THEME.primaryCyan, borderRadius: 14, alignItems: 'center', marginTop: 18, shadowColor: THEME.primaryCyan, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 13, letterSpacing: 1.8 },
  phoneContainer: { width: '100%', marginBottom: 20 },
  phoneCombinedWrapper: { backgroundColor: 'rgba(0, 0, 0, 0.4)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 14, height: 56, justifyContent: 'center' },
  phoneCodeInlineButton: { position: 'absolute', left: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, zIndex: 3, minWidth: 100 },
  countryFlag: { fontSize: 22, marginRight: 7 },
  countryCode: { color: THEME.textMain, fontSize: 15, fontWeight: '600', letterSpacing: 0.5, marginRight: 2 },
  phoneCombinedInput: { backgroundColor: 'transparent', borderWidth: 0, paddingLeft: 110, paddingRight: 16, paddingVertical: 16, fontSize: 15, fontWeight: '600', height: '100%' },
  userTypeButton: { position: 'relative' },
  errorSmall: { color: THEME.errorColor, fontSize: 11, marginBottom: 8, marginLeft: 5, fontWeight: '600' },
  statusText: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 11, marginBottom: 8, marginLeft: 5, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: THEME.primaryNavy, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  userTypeModal: { backgroundColor: THEME.primaryNavy, borderRadius: 20, marginHorizontal: 20, padding: 20 },
  userTypeModalOverlay: { justifyContent: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomColor: THEME.glassBorder, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: THEME.textMain },
  countryOption: { paddingVertical: 16, paddingHorizontal: 20, borderBottomColor: THEME.glassBorder, borderBottomWidth: 1 },
  countryOptionText: { color: THEME.textMain, fontSize: 14, fontWeight: '500' },
  userTypeWheelContainer: { marginTop: 12, height: USER_TYPE_ITEM_HEIGHT * 3, justifyContent: 'center' },
  userTypeWheelFocusRow: { position: 'absolute', left: 0, right: 0, top: USER_TYPE_ITEM_HEIGHT, height: USER_TYPE_ITEM_HEIGHT, borderRadius: 12, borderWidth: 1, borderColor: THEME.primaryCyan, backgroundColor: 'rgba(21, 229, 233, 0.1)', zIndex: 1 },
  userTypeWheelContent: { paddingVertical: USER_TYPE_ITEM_HEIGHT },
  userTypeWheelItem: { height: USER_TYPE_ITEM_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.65 },
  userTypeWheelItemActive: { opacity: 1 },
  userTypeWheelText: { color: THEME.textMuted, fontSize: 16, fontWeight: '600' },
  userTypeWheelTextActive: { color: THEME.textMain },
});

export default LoginScreen;
