import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore/lite';

const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};
export const authConfigured = Object.values(config).every((value) => typeof value === 'string' && value.trim());
let services: { auth: ReturnType<typeof getAuth>; db: ReturnType<typeof getFirestore> } | undefined;
export function firebase() {
  if (!authConfigured) throw new Error('Sign-in is not available yet. You can keep learning as a guest.');
  if (!services) {
    const app = initializeApp(config);
    services = { auth: getAuth(app), db: getFirestore(app) };
  }
  return services;
}
