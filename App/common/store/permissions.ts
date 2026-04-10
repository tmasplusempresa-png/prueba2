import * as BackgroundFetch from 'expo-background-fetch';
import * as Permissions from 'expo-permissions'; // Deprecated, but good for older versions of Expo

export const checkAndRequestPermissions = async () => {
  // Verifica si BackgroundFetch está disponible
  const status = await BackgroundFetch.getStatusAsync();
  switch (status) {
    case BackgroundFetch.Status.Restricted:
      //console.log('Background fetch is restricted.');
      break;
    case BackgroundFetch.Status.Denied:
      //console.log('Background fetch is denied.');
      break;
    case BackgroundFetch.Status.Available:
      //console.log('Background fetch is available.');
      break;
    default:
      //console.log('Unknown background fetch status');
      break;
  }

  // Nota: Con Expo SDK 40 y posteriores, los permisos específicos para background fetch no son necesarios.
  // Puedes solicitar otros permisos según tu necesidad (por ejemplo, ubicaciones, notificaciones, etc.)

  // Permiso de ubicación como ejemplo, si estás usando ubicaciones en segundo plano
  const { status: locationStatus } = await Permissions.askAsync(Permissions.LOCATION);
  if (locationStatus !== 'granted') {
    //console.log('Permiso de ubicación no concedido');
  }
};