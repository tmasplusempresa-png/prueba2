# AGENTS.md — T+Plus Mobile App

## Repo Layout

All app source lives under `App/`. The root of the repo also contains `documentacion/` and `imagenes/` but those are not part of the build.

Within `App/`:
- `app/` — Expo Router file-based routes (screens)
- `common/` — Redux store, actions, reducers, services, utils
- `components/` — Reusable UI components
- `config/` — Supabase, Firebase, Mapbox, keys, env config
- `hooks/` — Custom React hooks
- `functions/` — Firebase Cloud Functions (separate `package.json`, Node 18)
- `scripts/` — Build helpers, font gen, version bumping
- `supabase/` — Supabase Edge Functions and `config.toml`
- `json/` — Static data (i18n, animations, DB rules)
- `types/` — TypeScript ambient declarations

## Commands

All commands run from the `App/` directory.

```bash
npm install              # install deps (uses legacy-peer-deps)
npm run dev              # start dev server (development variant)
npm run start            # start with dev-client
npm run android          # run on Android
npm run ios              # run on iOS
npm run lint             # ESLint via expo lint
npm test                 # Jest (watch mode)
npm run test:ci          # Jest CI: --ci --coverage --forceExit
npm run test:coverage    # Jest coverage report
npm run test:e2e         # Maestro E2E (.maestro/)
npm run docs             # Generate TypeDoc API docs
npm run build            # update-version + eas build
```

Verification order: `lint -> test:ci`

## Path Alias

`@/` maps to the `App/` root. Configured in three places that must stay in sync:
- `babel.config.js` — `babel-plugin-module-resolver`
- `metro.config.js` — `resolver.extraNodeModules`
- `tsconfig.json` — `paths: { "@/*": ["./*"] }`
- `jest.config.js` — `moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" }`

## Environment Variables

`.env` is gitignored and **excluded from EAS builds** (`.easignore`). All env vars reach the app through `app.config.js` → `Constants.expoConfig.extra`, NOT directly via `process.env` at runtime.

Required vars (in `.env` at `App/` root):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `GOOGLE_MAPS_API_KEY_ANDROID`, `GOOGLE_MAPS_API_KEY_IOS` (separate keys per platform)
- `MAPBOX_ACCESS_TOKEN`, `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`

Google Maps keys are platform-split: Android key must work on Android, iOS key on iOS. Each falls back to the other but this can cause grey maps on the mismatched platform.

## App Name Gotcha

`app.config.js` hardcodes `app_name: 'TmasPlus'` (NOT from `.env`). This becomes the Xcode target name after sanitization. If `.env` and `app.config.js` disagree on the name, EAS iOS builds fail with `Could not find target 'X' in project.pbxproj`. Always edit `app.config.js` directly to change the display name.

## Testing

- **Unit**: Jest with `jest-expo` preset. Setup file: `jest.setup.ts`. Mocks common native modules (expo-router, reanimated, gesture-handler, safe-area, bottom-sheet, async-storage, lottie, vector-icons).
- **E2E**: Maestro flows in `.maestro/` (`login.yaml`, `full_flow.yaml`, `carnet.yaml`). Requires a built binary (not Expo Go).
- **Test files**: Only 4 exist currently (`common/__tests__/`, `app/(tabs)/__tests__/`, `components/__tests__/`).
- `transformIgnorePatterns` in `jest.config.js` explicitly allows many React Native packages through Babel transform.

## Build & Deploy

- **EAS Build** (managed workflow): `eas.json` has profiles: `development`, `preview` (APK), `simulator`, `production` (AAB/IPA).
- `ios/` and `android/` directories are gitignored — EAS regenerates them via `expo prebuild`. Never commit these directories.
- `assets.rar` (86 MB) is excluded from EAS builds.
- Production builds auto-increment version codes. Preview builds use APK (`buildType: "apk"`).

## Architecture Notes

- **Routing**: Expo Router v6 (`app/` directory). Root layout: `app/_layout.tsx`. Tabs layout: `app/(tabs)/_layout.tsx`.
- **State**: Redux Toolkit with slices: `authSlice`, `bookingsSlice`, `vehicleSlice`, `PromoSlice`, `complainSlice`. Store in `common/store/store.ts`.
- **Backend**: Supabase (primary — DB, auth, storage, realtime). Firebase JS SDK still used for Realtime Database (chat, booking notifications on driver side). Migration to Supabase is in progress.
- **Session storage key**: `tmasplus_auth_session`. Custom storage adapter in `SupabaseConfig.ts` discards sessions older than 14 days.
- **Auth flow**: PKCE (not implicit). `PASSWORD_RECOVERY` events are deliberately ignored in the global auth listener to avoid stack navigation during password reset deep links.
- **Notifications**: expo-notifications. Push token stored in Supabase `users.push_token`. Firebase Cloud Functions (`functions/`) send push to nearby drivers.
- **Fonts**: System font scaling is disabled globally in `_layout.tsx` (all Text/TextInput `allowFontScaling = false`).

## Known Debt

- Driver map (`app/(tabs)/index.tsx`) still listens for new bookings via Firebase Realtime Database instead of Supabase Realtime.
- Email verification is bypassed in dev — several screens skip `emailVerified` checks.
- Expo Notifications don't work in Expo Go (SDK 54 limitation). Use EAS dev client builds.
