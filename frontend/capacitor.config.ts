// Placeholder de configuración para empaquetar el frontend con Capacitor
// (apps Android/iOS). Este archivo por sí solo NO hace funcional Capacitor:
//
//   npm install @capacitor/core @capacitor/cli
//   npx cap init "MotoCore" "com.motocore.app" --web-dir=dist
//   npm run build
//   npx cap add android
//   npx cap add ios
//
// Ver https://capacitorjs.com/docs para el resto del flujo (sync, open, run).

const config = {
  appId: 'com.motocore.app',
  appName: 'MotoCore',
  webDir: 'dist',
}

export default config
