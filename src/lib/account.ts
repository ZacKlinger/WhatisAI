import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, deleteUser, reauthenticateWithPopup, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore/lite';
import { authConfigured, firebase } from './firebase';
import { setProgressOwner, getProgressOwner, exportProgress, importProgress } from './progress';
import { parseProgress } from './progress-data.mjs';

type Account = { ready: boolean; user: User | null; error: string };
const initial: Account = { ready: !authConfigured, user: null, error: '' };
let current = initial;
const listeners = new Set<() => void>();
let startup: Promise<void> | undefined;
const emit = (next: Account) => { current = next; listeners.forEach((fn) => fn()); };
export const accountSnapshot = () => current;
export const serverAccount = () => initial;
export const subscribeAccount = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export { authConfigured };

export function startAccount() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (startup) return startup;
  startup = new Promise<void>((resolve) => {
    if (!authConfigured) { setProgressOwner(null); resolve(); return; }
    try {
      onAuthStateChanged(firebase().auth, (user) => {
        setProgressOwner(user?.uid ?? null);
        emit({ ready: true, user, error: '' });
        resolve();
      }, () => {
        setProgressOwner(null);
        emit({ ready: true, user: null, error: 'Unable to restore sign-in. Reload to try again, or keep browsing.' });
        resolve();
      });
    } catch {
      setProgressOwner(null);
      emit({ ready: true, user: null, error: 'Sign-in is unavailable. You can keep learning as a guest.' });
      resolve();
    }
  });
  return startup;
}

const provider = () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
};
export function login() { return signInWithPopup(firebase().auth, provider()); }
export async function logout() { await signOut(firebase().auth); }

function owner() {
  const user = firebase().auth.currentUser;
  if (!user || current.user?.uid !== user.uid || getProgressOwner() !== user.uid) throw new Error('Please sign in again.');
  return user;
}
function assertOwner(uid: string) {
  if (firebase().auth.currentUser?.uid !== uid || current.user?.uid !== uid || getProgressOwner() !== uid) throw new Error('Your account changed. Try again.');
}
export async function saveCloudProgress() {
  const user = owner();
  const json = exportProgress();
  parseProgress(json);
  await setDoc(doc(firebase().db, 'progress', user.uid), { json, updatedAt: serverTimestamp(), version: 1 });
  assertOwner(user.uid);
}
export async function restoreCloudProgress() {
  const user = owner();
  const snapshot = await getDoc(doc(firebase().db, 'progress', user.uid));
  assertOwner(user.uid);
  if (!snapshot.exists()) throw new Error('No cloud save yet. Save progress from your other device first.');
  importProgress(snapshot.data().json);
}
export async function deleteCloudProgress() {
  const user = owner();
  await deleteDoc(doc(firebase().db, 'progress', user.uid));
  assertOwner(user.uid);
}
export async function removeAccount() {
  const user = owner();
  // Reauthenticate before any deletion so an expired session cannot erase just the backup.
  await reauthenticateWithPopup(user, provider());
  assertOwner(user.uid);
  await deleteDoc(doc(firebase().db, 'progress', user.uid));
  await deleteUser(user);
}
export function accountError(error: unknown) {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/popup-closed-by-user': 'Sign-in was canceled. You can try again whenever you’re ready.',
    'auth/cancelled-popup-request': 'Another sign-in window is already open.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.',
    'auth/unauthorized-domain': 'Sign-in is not enabled for this website address yet.',
    'auth/operation-not-allowed': 'Google sign-in has not been enabled yet.',
    'auth/network-request-failed': 'Could not connect. Check your connection and try again.',
    'permission-denied': 'Cloud access was denied. Your progress is still on this device. The site owner needs to check the database rules.',
    'resource-exhausted': 'Cloud saves have reached their usage limit. Your progress is still on this device. Try again later.',
    'unavailable': 'Cloud saves are unavailable right now. Your progress is still on this device.',
  };
  return code ? messages[code] ?? 'That didn’t finish. Please try again. Your local progress is unchanged.' : error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
