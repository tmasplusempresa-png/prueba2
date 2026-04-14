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

const LoginScreen = ({ navigation }: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const userTypeWheelRef = useRef<ScrollView>(null);

  // Auth states
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // additional registration states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [usertype, setUsertype] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [userTypeWheelIndex, setUserTypeWheelIndex] = useState(0);

  // Validation format states
  const [emailFormatValid, setEmailFormatValid] = useState(true);
  const [phoneFormatValid, setPhoneFormatValid] = useState(true);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const dispatch = useDispatch();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('error');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info' | 'confirm', title: string, message: string, buttons?: AlertButton[]) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  // Hooks de validación
  const emailValidation = useEmailValidation(email, emailFormatValid, !isLoginMode);
  const phoneValidation = usePhoneValidation(mobile, phoneFormatValid, countryCode, !isLoginMode);

  // Animations
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const keyboardOffsetAnim = useRef(new Animated.Value(0)).current;
  const passwordLiftAnim = useRef(new Animated.Value(0)).current;

  // Bloquear el gesto de atrás para no volver a PreLogin
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Retornar true previene el comportamiento por defecto de atrás
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowSub = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardOffsetAnim, {
        toValue: -18,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });

    const keyboardHideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardOffsetAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardShowSub.remove();
      keyboardHideSub.remove();
    };
  }, [keyboardOffsetAnim]);

  useEffect(() => {
    let liftValue = 0;
    if (confirmPasswordFocused) liftValue = -58;
    else if (passwordFocused) liftValue = -34;

    Animated.timing(passwordLiftAnim, {
      toValue: liftValue,
      duration: liftValue === 0 ? 220 : 180,
      useNativeDriver: true,
    }).start();
  }, [passwordFocused, confirmPasswordFocused, passwordLiftAnim]);

  useEffect(() => {
    if (!showUserTypeModal) return;

    const currentIndex = Math.max(
      0,
      USER_TYPE_OPTIONS.findIndex((option) => option.value === usertype)
    );

    setUserTypeWheelIndex(currentIndex);

    requestAnimationFrame(() => {
      userTypeWheelRef.current?.scrollTo({
        y: currentIndex * USER_TYPE_ITEM_HEIGHT,
        animated: false,
      });
    });
  }, [showUserTypeModal, usertype]);

  useEffect(() => {
    if (!isLoginMode && email) {
      setEmailExists(emailValidation.exists);
    }
  }, [emailValidation.exists, isLoginMode]);

  useEffect(() => {
    if (!isLoginMode && mobile) {
      setPhoneExists(phoneValidation.exists);
    }
  }, [phoneValidation.exists, isLoginMode]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      if (!data.user) throw new Error('No se pudo iniciar sesión');
      dispatch(login(data.user));
    } catch (error: any) {
      let message = "Error de autenticación";
      if (error.message.includes('Invalid login credentials')) {
        message = "Correo o contraseña incorrectos.";
      }
      setError(message);
      showAlert('error', 'Error', message);
    } finally {
      setLoading(false);
    }
  };

  // Función para sanitizar inputs
  const sanitizeInput = (input: string, type: 'text' | 'email' | 'phone' = 'text'): string => {
    if (!input) return '';
    
    let sanitized = input.trim();
    
    switch (type) {
      case 'email':
        // Eliminar espacios y convertir a minúsculas
        sanitized = sanitized.toLowerCase().replace(/\s+/g, '');
        break;
      case 'phone':
        // Solo dígitos
        sanitized = sanitized.replace(/\D/g, '');
        break;
      case 'text':
        // Eliminar caracteres especiales peligrosos pero mantener espacios y tildes
        sanitized = sanitized
          .replace(/[<>{}[\]\\]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        break;
    }
    
    return sanitized;
  };

  // Función para limpiar todos los campos del formulario
  const clearRegistrationForm = () => {
    console.log('🧹 [clearRegistrationForm] Limpiando formulario de registro...');
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setMobile("");
    setUsertype("");
    setAcceptTerms(false);
    setError("");
    setEmailExists(false);
    setPhoneExists(false);
    setEmailFormatValid(true);
    setPhoneFormatValid(true);
  };

  const handleSignUp = async () => {
    // Sanitizar campos antes de validar
    const sanitizedFirstName = sanitizeInput(firstName, 'text');
    const sanitizedLastName = sanitizeInput(lastName, 'text');
    const sanitizedEmail = sanitizeInput(email, 'email');
    const sanitizedMobile = sanitizeInput(mobile, 'phone');

    console.log('🧼 [handleSignUp] Campos sanitizados:', {
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      email: sanitizedEmail,
      phone: sanitizedMobile,
    });

    if (!sanitizedFirstName || !sanitizedLastName || !sanitizedEmail || !sanitizedMobile || !usertype || !password || !confirmPassword) {
      setError("Por favor completa todos los campos");
      showAlert('error', 'Error', 'Por favor completa todos los campos correctamente');
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      showAlert('error', 'Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      showAlert('error', 'Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones");
      showAlert('error', 'Error', 'Debes aceptar los términos y condiciones para continuar');
      return;
    }

    if (emailExists) {
      setError("Este correo ya está registrado");
      showAlert('error', 'Error', 'Este correo ya está registrado. Intenta iniciar sesión.');
      return;
    }

    if (phoneExists) {
      setError("Este teléfono ya está registrado");
      showAlert('error', 'Error', 'Este teléfono ya está registrado. Intenta iniciar sesión.');
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      console.log('🚀 [handleSignUp] Iniciando registro de usuario...');
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
            phone: `${countryCode}${sanitizedMobile}`,
            usertype: usertype || 'customer',
          },
        },
      });

      if (signUpError) {
        console.error('❌ [handleSignUp] Error en auth.signUp:', signUpError.message);
        throw signUpError;
      }

      if (!data.user) {
        console.error('❌ [handleSignUp] No se obtuvo user después de signUp');
        throw new Error('No se pudo crear el usuario');
      }

      console.log('✅ [handleSignUp] Usuario creado en auth.users:', data.user.id);
      
      // Insertar en tabla users pública
      const userRecord = {
        id: data.user.id,
        auth_id: data.user.id,
        email: sanitizedEmail,
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        mobile: `${countryCode}${sanitizedMobile}`,
        user_type: usertype || 'customer',
        approved: false,
        blocked: false,
        is_verified: false,
        driver_active_status: usertype === 'driver' ? false : false,
        wallet_balance: 0,
        rating: 0,
        total_rides: 0,
        user_platform: Platform.OS,
      };

      console.log('📝 [handleSignUp] Insertando en tabla users:', userRecord);

      const { error: insertError } = await supabase
        .from('users')
        .insert([userRecord] as any);

      if (insertError) {
        if (insertError.code === '23505') {
          const { data: existingUser, error: existingUserError } = await supabase
            .from('users')
            .select('id, auth_id, email')
            .eq('email', sanitizedEmail)
            .maybeSingle();

          if (!existingUserError && existingUser) {
            const belongsToCurrentSignup =
              existingUser.auth_id === data.user.id || existingUser.id === data.user.id;

            if (belongsToCurrentSignup) {
              console.log('ℹ️ [handleSignUp] El perfil ya existía en tabla users. Se continúa como registro exitoso.');
            } else {
              setEmailExists(true);
              setError('Este correo ya está registrado');
              showAlert('error', 'Error', 'Este correo ya está registrado. Intenta iniciar sesión.');
              return;
            }
          } else {
            setEmailExists(true);
            setError('Este correo ya está registrado');
            showAlert('error', 'Error', 'Este correo ya está registrado. Intenta iniciar sesión.');
            return;
          }
        } else {
          console.warn('⚠️ [handleSignUp] No se pudo insertar en tabla users:', insertError.message);
          console.warn('⚠️ [handleSignUp] Usuario creado en auth pero no en tabla users. Puede ser creado por trigger.');
        }
      } else {
        console.log('✅ [handleSignUp] Usuario insertado correctamente en tabla users');
      }
      
      // Limpiar formulario
      clearRegistrationForm();
      
      // Notificar éxito y cambiar a modo login
      showAlert('success', '¡Registro Exitoso!', `Bienvenido ${sanitizedFirstName}! Verifica tu email para confirmar tu cuenta. Ahora puedes iniciar sesión.`, [
        {
          text: 'Iniciar Sesión',
          onPress: () => {
            setAlertVisible(false);
            setIsLoginMode(true);
            setEmail(sanitizedEmail);
          }
        }
      ]);
      
      console.log('✅ [handleSignUp] Registro completado. Cambiando a modo login...');
      
    } catch (error: any) {
      console.error('❌ [handleSignUp] Error general:', error.message);
      
      let errorMessage = "Error al registrarse";
      if (error.message.includes('already registered')) {
        errorMessage = "Este correo ya está registrado. Intenta iniciar sesión.";
      } else if (error.message.includes('Invalid email')) {
        errorMessage = "El formato del correo no es válido";
      } else if (error.message.includes('Password')) {
        errorMessage = "La contraseña no cumple con los requisitos";
      } else {
        errorMessage = error.message || "Error al registrarse";
      }
      
      setError(errorMessage);
      showAlert('error', 'Error de Registro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    const sanitizedEmail = sanitizeInput(text, 'email');
    const normalizedEmail = normalizeEmail(sanitizedEmail);
    setEmail(normalizedEmail);
    
    if (normalizedEmail) {
      setEmailFormatValid(validateEmailFormat(normalizedEmail));
    } else {
      setEmailFormatValid(true);
    }
  };

  const handlePhoneChange = (text: string) => {
    const sanitizedPhone = sanitizeInput(text, 'phone');
    const phoneNumber = extractPhoneDigits(sanitizedPhone);
    setMobile(phoneNumber);
    
    if (phoneNumber) {
      setPhoneFormatValid(validatePhoneFormat(phoneNumber));
    } else {
      setPhoneFormatValid(true);
    }
  };

  const handleFirstNameChange = (text: string) => {
    const sanitized = sanitizeInput(text, 'text');
    setFirstName(sanitized);
  };

  const handleLastNameChange = (text: string) => {
    const sanitized = sanitizeInput(text, 'text');
    setLastName(sanitized);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Ingresa tu correo electrónico");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'tu-app://reset-password/',
      });
      if (error) throw error;
      showAlert('success', 'Listo', 'Revisa tu email para el enlace de reseteo');
    } catch (error: any) {
      showAlert('error', 'Error', error.message);
    }
  };

  const updateUserTypeFromIndex = (index: number, triggerVibration = true) => {
    const safeIndex = Math.min(Math.max(index, 0), USER_TYPE_OPTIONS.length - 1);
    const selectedOption = USER_TYPE_OPTIONS[safeIndex];

    setUserTypeWheelIndex(safeIndex);

    if (selectedOption.value !== usertype) {
      setUsertype(selectedOption.value);
      if (triggerVibration) {
        Vibration.vibrate(12);
      }
    }
  };

  return (
    <ImageBackground 
      source={require("./../../assets/images/login.jpg")} 
      resizeMode="cover" 
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexFill}
        enabled={Platform.OS === 'ios'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.flexFill}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            bounces={false}
            overScrollMode="never"
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
              {/* Logo & Title */}
              <View style={styles.logoContainer}>
                <Image
                  source={require("./../../assets/images/logo1024x1024.png")}
                  style={styles.logoImage}
                />
                <Text style={styles.logoTitle}>T+plus</Text>
                <Text style={styles.logoSubtitle}>Movilidad Inteligente</Text>
              </View>

              {/* Toggle Buttons */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, isLoginMode && styles.toggleBtnActive]}
                  onPress={() => {
                    setIsLoginMode(true);
                    setError("");
                  }}
                >
                  <Text style={[styles.toggleBtnText, isLoginMode && styles.toggleBtnTextActive]}>
                    Ingresar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, !isLoginMode && styles.toggleBtnActive]}
                  onPress={() => {
                    setIsLoginMode(false);
                    setError("");
                  }}
                >
                  <Text style={[styles.toggleBtnText, !isLoginMode && styles.toggleBtnTextActive]}>
                    Registro
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              {/* LOGIN FORM */}
              {isLoginMode ? (
                <View>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <Feather
                        name="user"
                        size={20}
                        color={emailFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {emailFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          emailFocused && styles.inputFocused,
                        ]}
                        placeholder="Email"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        editable={!loading}
                        autoCapitalize="none"
                      />
                      {emailFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>
                  {/* Password Input */}
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
                        style={[
                          styles.input,
                          passwordFocused && styles.inputFocused,
                        ]}
                        placeholder="Contraseña"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        keyboardType="default"
                        secureTextEntry={!isPasswordVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        textContentType="none"
                        importantForAutofill="no"
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => {
                          setPasswordFocused(true);
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: 520, animated: true });
                          }, 120);
                        }}
                        onBlur={() => setPasswordFocused(false)}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeIcon}
                        disabled={loading}
                      >
                        {isPasswordVisible ? (
                          <Feather name="eye" size={18} color="#fff" />
                        ) : (
                          <Feather name="eye-off" size={18} color="#fff" />
                        )}
                      </TouchableOpacity>
                      {passwordFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <Text style={styles.primaryBtnText}>
                      {loading ? "INICIANDO..." : "INICIAR SESIÓN"}
                    </Text>
                  </TouchableOpacity>

                  {/* Remember Me - Centered */}
                  <View style={styles.rememberMeContainer}>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setRememberMe(!rememberMe)}
                      disabled={loading}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                        {rememberMe && (
                          <AntDesign name="check" size={12} color="#fff" style={{ marginTop: -2 }} />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>Recordarme</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Forgot Password Link - Centered */}
                  <TouchableOpacity 
                    onPress={handlePasswordReset} 
                    disabled={loading}
                    style={styles.forgotPasswordContainer}
                  >
                    <Text style={styles.forgotLink}>¿Olvidaste tu clave?</Text>
                  </TouchableOpacity>

                  {/* Sign Up Link */}
                  <TouchableOpacity 
                    onPress={() => setIsLoginMode(false)}
                    disabled={loading}
                    style={styles.signUpLinkContainer}
                  >
                    <Text style={styles.signUpLinkText}>
                      ¿No tienes cuenta?{' '}
                      <Text style={styles.signUpLinkHighlight}>Regístrate</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // SIGNUP FORM
                <View>
                  {/* First & Last Name */}
                  <View style={styles.inputGroup}>
                    <View style={[styles.inputWrapper, firstNameFocused && styles.inputFocused]}
                    >
                      <Feather
                        name="user"
                        size={20}
                        color={firstNameFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {firstNameFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          firstNameFocused && styles.inputFocused,
                        ]}
                        placeholder="Nombre"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={firstName}
                        onChangeText={handleFirstNameChange}
                        onFocus={() => setFirstNameFocused(true)}
                        onBlur={() => setFirstNameFocused(false)}
                        editable={!loading}
                        autoCapitalize="words"
                      />
                      {firstNameFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={[styles.inputWrapper, lastNameFocused && styles.inputFocused]}
                    >
                      <Feather
                        name="user"
                        size={20}
                        color={lastNameFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {lastNameFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          lastNameFocused && styles.inputFocused,
                        ]}
                        placeholder="Apellido"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={lastName}
                        onChangeText={handleLastNameChange}
                        onFocus={() => setLastNameFocused(true)}
                        onBlur={() => setLastNameFocused(false)}
                        editable={!loading}
                        autoCapitalize="words"
                      />
                      {lastNameFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons
                        name="email"
                        size={20}
                        color={emailFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {emailFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          emailFocused && styles.inputFocused,
                        ]}
                        placeholder="Email"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={handleEmailChange}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        editable={!loading}
                        autoCapitalize="none"
                      />
                      {emailFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>
                  {emailExists && <Text style={styles.errorSmall}>Este correo ya está registrado</Text>}

                  {/* Phone with Country Code */}
                  <View style={styles.phoneContainer}>
                    <View style={[styles.inputWrapper, styles.phoneCombinedWrapper, phoneFocused && styles.inputFocused]}>
                      <TouchableOpacity
                        style={styles.phoneCodeInlineButton}
                        onPress={() => setShowCountryModal(true)}
                      >
                        <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                        <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={14} color={THEME.textMuted} style={styles.phoneCodeChevron} />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.input, styles.phoneCombinedInput]}
                        placeholder="3005551234"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={mobile}
                        onChangeText={handlePhoneChange}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        keyboardType="phone-pad"
                        maxLength={10}
                        editable={!loading}
                      />
                    </View>
                  </View>
                  {phoneExists && <Text style={styles.errorSmall}>Este teléfono ya está registrado</Text>}

                  {/* User Type */}
                  <TouchableOpacity
                    style={[styles.inputGroup, styles.inputWrapper, styles.userTypeButton]}
                    onPress={() => setShowUserTypeModal(true)}
                  >
                    <AntDesign name="idcard" size={20} color={usertype ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                    <Text style={[styles.input, { color: usertype ? THEME.textMain : THEME.textMuted }]}> 
                      {usertype ? (usertype === 'driver' ? 'Conductor' : 'Cliente') : 'Soy...'}
                    </Text>
                  </TouchableOpacity>

                  {/* Password Input */}
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
                        style={[
                          styles.input,
                          passwordFocused && styles.inputFocused,
                        ]}
                        placeholder="Contraseña"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        keyboardType="default"
                        secureTextEntry={!isPasswordVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        textContentType="none"
                        importantForAutofill="no"
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeIcon}
                        disabled={loading}
                      >
                        {isPasswordVisible ? (
                          <Feather name="eye" size={18} color="#fff" />
                        ) : (
                          <Feather name="eye-off" size={18} color="#fff" />
                        )}
                      </TouchableOpacity>
                      {passwordFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <AntDesign
                        name="lock"
                        size={20}
                        color={confirmPasswordFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {confirmPasswordFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          confirmPasswordFocused && styles.inputFocused,
                        ]}
                        placeholder="Confirmar Contraseña"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        keyboardType="default"
                        secureTextEntry={!isConfirmPasswordVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        textContentType="none"
                        importantForAutofill="no"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => {
                          setConfirmPasswordFocused(true);
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: 760, animated: true });
                          }, 120);
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: 920, animated: true });
                          }, 320);
                        }}
                        onBlur={() => setConfirmPasswordFocused(false)}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        style={styles.eyeIcon}
                        disabled={loading}
                      >
                        {isConfirmPasswordVisible ? (
                          <Feather name="eye" size={18} color="#fff" />
                        ) : (
                          <Feather name="eye-off" size={18} color="#fff" />
                        )}
                      </TouchableOpacity>
                      {confirmPasswordFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  {/* Terms Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAcceptTerms(!acceptTerms)}
                    disabled={loading}
                  >
                    <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
                      {acceptTerms && (
                        <AntDesign name="check" size={12} color="#fff" style={{ marginTop: -2 }} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Acepto los términos y condiciones</Text>
                  </TouchableOpacity>

                  {/* Signup Button */}
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (loading || !acceptTerms) && styles.primaryBtnDisabled,
                    ]}
                    onPress={handleSignUp}
                    disabled={loading || !acceptTerms}
                  >
                    <Text style={styles.primaryBtnText}>
                      {loading ? "CREANDO..." : "CREAR CUENTA"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Country Modal */}
          <Modal visible={showCountryModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecciona país</Text>
                  <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                    <AntDesign name="close" size={24} color={THEME.textMain} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={COUNTRIES}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item }: { item: typeof COUNTRIES[0] }) => (
                    <TouchableOpacity
                      style={styles.countryOption}
                      onPress={() => {
                        setSelectedCountry(item);
                        setCountryCode(item.code);
                        setShowCountryModal(false);
                      }}
                    >
                      <Text style={styles.countryOptionText}>{item.flag} {item.name} ({item.code})</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          {/* User Type Modal */}
          <Modal visible={showUserTypeModal} transparent animationType="fade">
            <View style={[styles.modalOverlay, styles.userTypeModalOverlay]}>
              <View style={styles.userTypeModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Soy...</Text>
                  <TouchableOpacity onPress={() => setShowUserTypeModal(false)}>
                    <AntDesign name="close" size={24} color={THEME.textMain} />
                  </TouchableOpacity>
                </View>
                <View style={styles.userTypeWheelContainer}
                >
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
                      const active = index === userTypeWheelIndex;

                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.userTypeWheelItem, active && styles.userTypeWheelItemActive]}
                          onPress={() => {
                            userTypeWheelRef.current?.scrollTo({
                              y: index * USER_TYPE_ITEM_HEIGHT,
                              animated: true,
                            });
                            updateUserTypeFromIndex(index);
                          }}
                        >
                          <AntDesign name={option.icon as any} size={22} color={THEME.primaryCyan} />
                          <Text style={[styles.userTypeWheelText, active && styles.userTypeWheelTextActive]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </View>
          </Modal>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: THEME.darkBg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 15,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.textMain,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 11,
    color: THEME.primaryCyan,
    fontWeight: '500',
    letterSpacing: 1.5,
    marginTop: 5,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 6,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(21, 229, 233, 0.15)',
    shadowColor: THEME.primaryCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toggleBtnText: {
    color: THEME.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  toggleBtnTextActive: {
    color: THEME.textMain,
  },
  errorText: {
    color: THEME.errorColor,
    fontSize: 13,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
  },
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
  inputFocused: {
    borderColor: THEME.primaryCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 2,
    padding: 8,
  },
  scanLine: {
    position: 'absolute',
    bottom: 0,
    left: '5%',
    right: '5%',
    height: 2,
    backgroundColor: THEME.primaryCyan,
    borderRadius: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeContainer: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(21, 229, 233, 0.5)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: THEME.primaryCyan,
    borderColor: THEME.primaryCyan,
  },
  checkboxLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotLink: {
    color: THEME.primaryCyan,
    fontSize: 12,
    fontWeight: '600',
  },
  signUpLinkContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  signUpLinkText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  signUpLinkHighlight: {
    color: THEME.primaryCyan,
    fontWeight: '700',
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
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1.8,
  },
  // additional styles for country/user modals and phone input
  phoneContainer: {
    width: '100%',
    marginBottom: 20,
  },
  phoneCombinedWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
  },
  phoneCodeInlineButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingRight: 12,
    zIndex: 3,
    minWidth: 100,
  },
  phoneCodeChevron: {
    marginLeft: 4,
    opacity: 0.7,
  },
  countryFlag: {
    fontSize: 22,
    marginRight: 7,
  },
  countryCode: {
    color: THEME.textMain,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginRight: 2,
  },
  phoneCombinedInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingLeft: 110,
    paddingRight: 16,
    paddingVertical: 16,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  userTypeButton: {
    position: 'relative',
  },
  errorSmall: {
    color: THEME.errorColor,
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 5,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.primaryNavy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  userTypeModal: {
    backgroundColor: THEME.primaryNavy,
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
  },
  userTypeModalOverlay: {
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomColor: THEME.glassBorder,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textMain,
  },
  countryOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomColor: THEME.glassBorder,
    borderBottomWidth: 1,
  },
  countryOptionText: {
    color: THEME.textMain,
    fontSize: 14,
    fontWeight: '500',
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(21, 229, 233, 0.1)',
    borderRadius: 12,
    marginVertical: 8,
    borderColor: THEME.primaryCyan,
    borderWidth: 1,
  },
  userTypeOptionText: {
    color: THEME.textMain,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  userTypeWheelContainer: {
    marginTop: 12,
    height: USER_TYPE_ITEM_HEIGHT * 3,
    justifyContent: 'center',
  },
  userTypeWheelFocusRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: USER_TYPE_ITEM_HEIGHT,
    height: USER_TYPE_ITEM_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.primaryCyan,
    backgroundColor: 'rgba(21, 229, 233, 0.1)',
    zIndex: 1,
  },
  userTypeWheelContent: {
    paddingVertical: USER_TYPE_ITEM_HEIGHT,
  },
  userTypeWheelItem: {
    height: USER_TYPE_ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    opacity: 0.65,
  },
  userTypeWheelItemActive: {
    opacity: 1,
  },
  userTypeWheelText: {
    color: THEME.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  userTypeWheelTextActive: {
    color: THEME.textMain,
  },
});

export default LoginScreen;

