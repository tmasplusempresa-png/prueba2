import { Platform } from 'react-native';

/**
 * iOS no puede presentar la camara mientras un <Modal> de React Native sigue
 * visible: el modal ocupa el contexto de presentacion del view controller, asi
 * que UIImagePickerController no encuentra donde montarse y
 * ImagePicker.launchCameraAsync() falla EN SILENCIO — no lanza error, no abre
 * la camara, y el dialogo de permiso tampoco alcanza a mostrarse. En Android no
 * pasa porque no tiene esa restriccion de presentacion.
 *
 * Por eso hay que cerrar el modal ANTES de pedir permiso o lanzar la camara, y
 * esperar a que termine su animacion de salida. Sin la espera, el modal sigue
 * montado en el momento de la presentacion y el fallo se reproduce igual.
 *
 * Uso:
 *   await closeModalBeforeCamera(() => setModalVisible(false));
 *   const { granted } = await ImagePicker.requestCameraPermissionsAsync();
 *   const result = await ImagePicker.launchCameraAsync({ ... });
 */
export const MODAL_DISMISS_MS = 450;

export const closeModalBeforeCamera = async (closeModal: () => void): Promise<void> => {
  closeModal();
  // Android presenta la camara sin problema con el modal abierto; no le
  // imponemos una espera que solo se notaria como lentitud.
  if (Platform.OS !== 'ios') return;
  await new Promise<void>((resolve) => setTimeout(resolve, MODAL_DISMISS_MS));
};
