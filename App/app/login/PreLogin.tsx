import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ImageBackground, Image, Animated } from 'react-native';
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;

const MOBILITY_PHRASES = [
  'Movilidad Urbana e Intermunicipal',
  'Transporte Urbano',
  'Conexión Inteligente',
  'Viajes Seguros',
  'Futuro Sostenible',
];

const PreLogin = ({ navigation }: Props) => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const textFadeAnim = React.useRef(new Animated.Value(1)).current;
  
  // Animaciones individuales para cada elemento
  const logoScaleAnim = React.useRef(new Animated.Value(0)).current;
  const titleFadeAnim = React.useRef(new Animated.Value(0)).current;
  const tagline1FadeAnim = React.useRef(new Animated.Value(0)).current;
  const tagline2FadeAnim = React.useRef(new Animated.Value(0)).current;

  // Animación de entrada para todos los elementos
  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(tagline1FadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(tagline2FadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Rotación de frases de movilidad
  useEffect(() => {
    if (!showWelcome) return;

    const phraseInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentPhraseIndex((prev) => (prev + 1) % MOBILITY_PHRASES.length);
    }, 1700);

    return () => clearInterval(phraseInterval);
  }, [showWelcome, textFadeAnim]);

  // Transición a pantalla de login después de 2.5 segundos
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }).start(() => {
        if (!isMounted) return;
        setShowWelcome(false);
        const navTimer = setTimeout(() => {
          if (!isMounted) return;
          try {
            navigation.navigate("Login");
          } catch (_e) {
            // Auth state resolved to authenticated while splash was showing;
            // the navigator already switched to the authenticated group — nothing to do.
          }
        }, 300);
        // store inner timer so cleanup can cancel it
        return () => clearTimeout(navTimer);
      });
    }, 2700);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [navigation, fadeAnim]);

  return (
    <ImageBackground source={require('./../../assets/images/prelogin.jpg')} style={styles.backgroundImage}>
      <View style={styles.overlay} />
      
      {showWelcome ? (
        <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
          <Animated.Image 
            source={require('@/assets/images/logo1024x1024.png')} 
            style={[
              styles.welcomeLogo,
              {
                transform: [{ scale: logoScaleAnim }]
              }
            ]} 
          />
          
          <Animated.Text style={[styles.welcomeTitle, { opacity: titleFadeAnim }]}>
            T+Plus
          </Animated.Text>
          
          {/* Frases de movilidad inteligente rotativas */}
          <Animated.Text style={[styles.mobilityPhrase, { opacity: textFadeAnim }]}>
            {MOBILITY_PHRASES[currentPhraseIndex]}
          </Animated.Text>
          
          {/* Lema principal */}
          <View style={styles.taglineContainer}>
            <Animated.Text style={[styles.taglineMainText, { opacity: tagline1FadeAnim }]}>
              Justo para ti
            </Animated.Text>
            <Animated.Text style={[styles.taglineSecondaryText, { opacity: tagline2FadeAnim }]}>
              Justo para todos
            </Animated.Text>
          </View>
        </Animated.View>
      ) : null}
    </ImageBackground>
  );
}; 

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  welcomeLogo: {
    width: 130,
    height: 130,
    marginBottom: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  welcomeTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 0.5,
  },
  mobilityPhrase: {
    fontSize: 18,
    fontWeight: '600',
    color: '#15e5e9',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
    textAlign: 'center',
    minHeight: 28,
    letterSpacing: 0.3,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  taglineMainText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  taglineSecondaryText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#15e5e9',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 0.5,
  },
});

export default PreLogin;
