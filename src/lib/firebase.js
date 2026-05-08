/* Firebase Realtime Database for Rohan Kini portfolio.
 *
 * Setup (one-time):
 *   1. Firebase console → Add project → "rohan-kini-portfolio"
 *   2. Build → Realtime Database → Create → Asia (Singapore) → Test mode
 *   3. Project settings → Your apps → Web → register → copy config
 *   4. Drop the values into .env (and Vercel env vars). Keys must start with VITE_.
 *
 * Falls back to localStorage if env vars are missing (offline mode, no sync).
 */
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const config = {
  apiKey:        import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:   import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:     import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:         import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.databaseURL);

let app = null;
let db = null;
if (isFirebaseConfigured) {
  app = initializeApp(config);
  db = getDatabase(app);
} else if (typeof window !== 'undefined') {
  console.warn(
    '[firebase] No VITE_FIREBASE_* env vars set — running in offline-only mode (localStorage). ' +
    'Cross-device sync will not work until env vars are configured. See src/lib/firebase.js.'
  );
}

export { app, db };
