import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground,
  Animated, ScrollView, KeyboardAvoidingView, Keyboard, Modal, FlatList,
  BackHandler, Platform, TouchableWithoutFeedback, Vibration, ActivityIndicator
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
import { ValidationService } from '@/common/services/ValidationService';
import { useAuth } from '@/hooks/useAuth';

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
  });

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
  });

  // Alert State
  const [alert, setAlert] = useState({
    visible: false,
    type: "error" as any,
    title: "",
    message: "",
    buttons: [] as AlertButton[]
  });

  // Validation Hooks
  const emailValidation = useEmailValidation(form.email, validation.emailFormatValid, !ui.isLoginMode);
  const phoneValidation = usePhoneValidation(form.mobile, validation.phoneFormatValid, country.countryCode, !ui.isLoginMode);

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
    });
    setValidation(prev => ({ ...prev, emailExists: false, phoneExists: false, acceptTerms: false }));
    setUI(prev => ({ ...prev, error: "" }));
  }, []);

  // ============ HANDLERS - LOGIN ============
  const handleLogin = useCallback(async () => {
    if (!form.email || !form.password) {
      setUI(u => ({ ...u, error: "Completa todos los campos" }));
      return;
    }

    setUI(u => ({ ...u, loading: true, error: "" }));
    try {
      const user = await loginUser({
        email: normalizeEmail(form.email),
        password: form.password,
      });
      dispatch(login(user));
    } catch (e: any) {
      setUI(u => ({ ...u, error: e.message }));
      showAlert("error", "Error", e.message);
    } finally {
      setUI(u => ({ ...u, loading: false }));
    }
  }, [form.email, form.password, loginUser, dispatch, showAlert]);

  // ============ HANDLERS - SIGNUP ============
  const handleSignUp = useCallback(async () => {
    const sanitizedFirstName = sanitizeInput(form.firstName, 'text');
    const sanitizedLastName = sanitizeInput(form.lastName, 'text');
    const sanitizedEmail = sanitizeInput(form.email, 'email');
    const sanitizedMobile = sanitizeInput(form.mobile, 'phone');

    if (!sanitizedFirstName || !sanitizedLastName || !sanitizedEmail || !sanitizedMobile || !form.usertype || !form.password || !form.confirmPassword) {
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

    if (!validation.acceptTerms) {
      showAlert('error', 'Error', 'Debes aceptar los términos y condiciones');
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

    // Validación en tiempo real adicional al enviar el formulario
    const emailCheck = await ValidationService.checkEmailExists(sanitizedEmail);
    if (emailCheck.error) {
      showAlert('error', 'Error', emailCheck.error);
      return;
    }
    if (emailCheck.exists) {
      setValidation(v => ({ ...v, emailExists: true }));
      showAlert('error', 'Error', 'Este correo ya está registrado. Intenta iniciar sesión.');
      return;
    }

    const phoneCheck = await ValidationService.checkPhoneExists(sanitizedMobile, country.countryCode);
    if (phoneCheck.error) {
      showAlert('error', 'Error', phoneCheck.error);
      return;
    }
    if (phoneCheck.exists) {
      setValidation(v => ({ ...v, phoneExists: true }));
      showAlert('error', 'Error', 'Este teléfono ya está registrado.');
      return;
    }

    setUI(u => ({ ...u, loading: true, error: "" }));
    try {
      await signupUser({
        email: sanitizedEmail,
        password: form.password,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        phone: `${country.countryCode}${sanitizedMobile}`,
        usertype: form.usertype,
      });

      setForm(prev => ({
        ...prev,
        email: sanitizedEmail,
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        mobile: '',
        usertype: '',
      }));
      setValidation(v => ({ ...v, emailExists: false, phoneExists: false, acceptTerms: false }));
      setUI(u => ({ ...u, isLoginMode: true, loading: false, error: '' }));

      showAlert('success', '¡Registro Exitoso!', `Bienvenido ${sanitizedFirstName}! Te hemos enviado un email de confirmación. Debes activar la cuenta desde el link antes de poder iniciar sesión. Si no lo ves, revisa tu carpeta de spam.`, [
        {
          text: 'Entendido',
          onPress: () => setAlert(a => ({ ...a, visible: false })),
        }
      ]);
    } catch (e: any) {
      showAlert('error', 'Error', e.message);
    } finally {
      setUI(u => ({ ...u, loading: false }));
    }
  }, [form, country.countryCode, validation.acceptTerms, validation.emailExists, validation.phoneExists, sanitizeInput, signupUser, showAlert, clearRegistrationForm, updateField]);

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
    if (!form.email) {
      showAlert('error', 'Error', 'Ingresa tu correo electrónico');
      return;
    }
    showAlert('success', 'Enviado', 'Revisa tu email para el enlace de reseteo');
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
                  <Text style={styles.logoTitle}>T+plus</Text>
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

                    {/* Terms */}
                    <TouchableOpacity style={styles.checkboxRow} onPress={() => setValidation(v => ({ ...v, acceptTerms: !v.acceptTerms }))} disabled={ui.loading}>
                      <View style={[styles.checkbox, validation.acceptTerms && styles.checkboxActive]}>
                        {validation.acceptTerms && <AntDesign name="check" size={12} color="#fff" />}
                      </View>
                      <Text style={styles.checkboxLabel}>Acepto los términos y condiciones</Text>
                    </TouchableOpacity>

                    {/* Signup Button */}
                    <TouchableOpacity style={[styles.primaryBtn, (ui.loading || !validation.acceptTerms) && styles.primaryBtnDisabled]} onPress={handleSignUp} disabled={ui.loading || !validation.acceptTerms}>
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
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(21, 229, 233, 0.5)', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  checkboxActive: { backgroundColor: THEME.primaryCyan, borderColor: THEME.primaryCyan },
  checkboxLabel: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 12, fontWeight: '500' },
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
