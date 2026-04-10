import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Dimensions, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

type Props = {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

const TYPE_CONFIG: Record<AlertType, { icon: string; color: string; glow: string }> = {
  success: { icon: 'checkmark-circle', color: '#00E676', glow: 'rgba(0,230,118,0.12)' },
  error:   { icon: 'alert-circle',     color: '#E91E63', glow: 'rgba(255,82,82,0.12)' },
  warning: { icon: 'warning',          color: '#00E5FF', glow: 'rgba(255,214,0,0.12)' },
  info:    { icon: 'information-circle',color: '#00E5FF', glow: 'rgba(0,229,255,0.12)' },
  confirm: { icon: 'help-circle',       color: '#00E5FF', glow: 'rgba(0,229,255,0.12)' },
};

const CustomAlert: React.FC<Props> = ({
  visible, type = 'info', title, message, buttons, onDismiss, icon,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, friction: 6, tension: 100, useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.sequence([
          Animated.timing(iconBounce, { toValue: -8, duration: 150, useNativeDriver: true }),
          Animated.timing(iconBounce, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      iconBounce.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  const config = TYPE_CONFIG[type];
  const resolvedIcon = icon || config.icon;
  const resolvedButtons = buttons && buttons.length > 0
    ? buttons
    : [{ text: 'OK', onPress: undefined, style: 'default' as const }];

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[st.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity style={st.overlayTouch} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            st.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Glow */}
          <View style={[st.glow, { backgroundColor: config.glow }]} />

          {/* Logo */}
          <Animated.View style={[st.iconWrap, { borderColor: config.color, transform: [{ translateY: iconBounce }] }]}>
            <Image
              source={require('../assets/images/logo-Preview.png')}
              style={st.logoImg}
            />
          </Animated.View>

          {/* Title */}
          <Text style={st.title}>{title}</Text>

          {/* Message */}
          <Text style={st.message}>{message}</Text>

          {/* Buttons */}
          <View style={[st.buttonRow, resolvedButtons.length === 1 && st.buttonRowSingle]}>
            {resolvedButtons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const isPrimary = !isCancel && !isDestructive;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    st.btn,
                    isPrimary && { backgroundColor: config.color },
                    isCancel && st.btnCancel,
                    isDestructive && st.btnDestructive,
                    resolvedButtons.length === 1 && st.btnFull,
                  ]}
                  activeOpacity={0.82}
                  onPress={() => {
                    handleClose();
                    setTimeout(() => btn.onPress?.(), 200);
                  }}
                >
                  <Text
                    style={[
                      st.btnText,
                      isPrimary && st.btnTextPrimary,
                      isCancel && st.btnTextCancel,
                      isDestructive && st.btnTextDestructive,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CustomAlert;

const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,12,20,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: width * 0.84,
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: 'rgba(8,38,56,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.18)',
    paddingTop: 32,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#00E5FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#051A26',
    borderWidth: 2.5,
    marginBottom: 18,
    overflow: 'hidden',
  },
  logoImg: {
    width: 78,
    height: 78,
    borderRadius: 39,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFull: {
    flex: undefined,
    width: '100%',
  },
  btnCancel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnDestructive: {
    backgroundColor: 'rgba(255,82,82,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.3)',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextPrimary: {
    color: '#051A26',
  },
  btnTextCancel: {
    color: 'rgba(255,255,255,0.6)',
  },
  btnTextDestructive: {
    color: '#E91E63',
  },
});


