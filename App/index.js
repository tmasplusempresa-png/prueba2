import { registerRootComponent } from 'expo';
// import * as Sentry from '@sentry/react-native';
import App from './App';

// TODO: Sentry disabledfor build testing - uncomment after successful build
// Configuración de Sentry con DSN y ajustes recomendados
// Sentry.init({
//   dsn: "...",
// });

// Captura de errores no manejados
// ErrorUtils.setGlobalHandler((error, isFatal) => {
//   Sentry.captureException(error);
// });
registerRootComponent(App);
