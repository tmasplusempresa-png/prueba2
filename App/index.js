// Este proyecto usa Expo Router: el punto de entrada real es "expo-router/entry"
// (declarado en package.json -> "main"). El dev client carga
// ".expo/.virtual-metro-entry", que resuelve a expo-router/entry.
//
// Antes este archivo hacía `import App from './App'` (esquema pre-router),
// pero ese App.tsx ya no existe y rompía cualquier build por /index.bundle.
// Se mantiene por compatibilidad, delegando en el entry de Expo Router.
import 'expo-router/entry';
