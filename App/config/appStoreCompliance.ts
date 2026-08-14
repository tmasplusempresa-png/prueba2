import { Platform } from 'react-native';

/**
 * Si la app puede ofrecer la compra de membresias y paquetes de kilometros.
 *
 * En iOS es false. La membresia del conductor habilita aceptar viajes, es decir
 * desbloquea funcionalidad dentro de la app, y la Guideline 3.1.1 de Apple exige
 * que eso pase por su compra integrada. Cobrar con PayU, Daviplata o Mercado
 * Pago para eso es causa de rechazo, y enlazar hacia afuera para cobrar tambien
 * lo esta (reglas anti-steering).
 *
 * En iOS el conductor gestiona su membresia por fuera de la app y aqui solo se
 * refleja el estado. Los puntos de entrada a la compra derivan a soporte, que
 * si esta permitido porque no es un cobro ni un enlace de pago.
 *
 * Android no cambia: mantiene el flujo de compra completo.
 */
export const PUEDE_COMPRAR_EN_APP = Platform.OS !== 'ios';
