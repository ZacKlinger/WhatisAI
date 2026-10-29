import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { accountSnapshot, serverAccount, subscribeAccount, startAccount, authConfigured, login, logout, saveCloudProgress, restoreCloudProgress, deleteCloudProgress, removeAccount, accountError } from '@/lib/account';
import { copyGuestProgress } from '@/lib/progress';
import { url } from '@/lib/url';

export default function Account({ compact = false }: { compact?: boolean }) {
  const account = useSyncExternalStore(subscribeAccount, accountSnapshot, serverAccount);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  type Confirmation = { text: string; action: () => Promise<unknown> | void; success: string; uid: string };
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { setConfirmation(null); }, [account.user?.uid]);
  useEffect(() => {
    if (confirmation) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirmation]);
  function ask(text: string, action: Confirmation['action'], success: string) {
    if (account.user) setConfirmation({ text, action, success, uid: account.user.uid });
  }
  function confirmAction() {
    if (!confirmation) return;
    const pending = confirmation;
    setConfirmation(null);
    void perform(() => {
      if (accountSnapshot().user?.uid !== pending.uid) throw new Error('Your account changed. Please try again.');
      return pending.action();
    }, pending.success);
  }
  useEffect(() => { void startAccount(); }, []);
  async function perform(action: () => Promise<unknown> | void, success = '') {
    setBusy(true); setMessage(''); setFailed(false);
    try { await action(); setMessage(success); }
    catch (error) { setMessage(accountError(error)); setFailed(true); }
    finally { setBusy(false); }
  }
  if (compact) return <a className="account-link" href={url('/account/')} aria-label={account.user ? 'Your account' : 'Sign in'}>{account.user ? 'Account' : 'Sign in'}</a>;
  const disabled = busy || !account.ready || Boolean(confirmation);
  return <div className="account-panel">
    <dialog ref={dialog} className="account-confirm" aria-labelledby="account-confirm-title" aria-describedby="account-confirm-description" onCancel={(event) => { event.preventDefault(); setConfirmation(null); }}>
      <h2 id="account-confirm-title">Confirm account action</h2>
      <p id="account-confirm-description">{confirmation?.text}</p>
      <div className="row account-actions">
        <button type="button" className="btn btn-secondary" autoFocus onClick={() => setConfirmation(null)}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={confirmAction}>Confirm</button>
      </div>
    </dialog>
    <div className="card account-card">
      <div className="eyebrow">{account.user ? 'Your account' : 'Your next discovery awaits'}</div>
      <h2>{account.user ? `Hello, ${account.user.displayName?.split(' ')[0] || 'learner'}.` : 'Make room for curiosity.'}</h2>
      {account.user ? <>
        <p className="muted account-email">Signed in as {account.user.email || 'a Google account'}</p>
        <p>Lessons are open to everyone. Your account keeps a private cloud save you can restore on another device.</p>
        <div className="row account-actions">
          <a className="btn btn-primary" href={url('/explore/')}>Keep exploring</a>
          <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => ask('Sign out and clear your account progress from this browser? Save to your account or export first to keep recent work.', logout, 'Signed out. Your account’s cached progress was removed from this browser.')}>Sign out</button>
        </div>
      </> : <>
        <p>Sign in with Google to save your learning progress to your account. New here? Your first sign-in creates your account.</p>
        <button type="button" className="btn google-button" disabled={disabled || !authConfigured} onClick={() => void perform(login)}>
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.5-.1-2.9-.4-4.3H24v8.2h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15.2Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.6a12.2 12.2 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.6 19.6 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"/></svg>
          {busy ? 'Connecting…' : 'Continue with Google'}
        </button>
        {!authConfigured && <p className="account-notice">Account sign-in is coming soon. All lessons and browser progress are available now.</p>}
        {!account.ready && <p role="status">Checking your session…</p>}
        <a className="link account-guest" href={url('/explore/')}>Explore without an account →</a>
        <p className="small muted">We use your Google name and email to identify your account. We don’t request access to Gmail, Drive, or your contacts. Read our <a className="link" href={url('/privacy/')}>privacy information</a>.</p>
      </>}
    </div>
    {account.user && <div className="card account-card">
      <h2 className="h3">Take your progress with you.</h2>
      <p>Learning saves automatically on this device. Save a copy to your account before switching devices, then restore it here. Cloud saves are manual; the latest save replaces the previous copy.</p>
      <div className="row account-actions">
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={() => ask('Replace your cloud save with the progress on this device?', saveCloudProgress, 'Progress saved to your account. You can now restore it on another device.')}>Save to account</button>
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => ask('Replace this device’s account progress with your cloud save? Export a copy from Your progress first if needed.', restoreCloudProgress, 'Cloud progress restored on this device.')}>Restore from account</button>
      </div>
      <a className="link" href={url('/progress/')}>View or export your progress →</a>
      <details className="account-details"><summary>Bring over guest progress</summary><p>Guest progress stays separate from your account. Copy it here only if it’s yours. This replaces your account progress on this device; it does not change your cloud save.</p><button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => ask('Replace local account progress with this browser’s guest progress?', copyGuestProgress, 'Guest progress copied. Use Save to account to keep it in the cloud.')}>Copy guest progress</button></details>
      <details className="account-details"><summary>Delete your data</summary><p>You can remove your cloud save or delete your account. Deleting an account also deletes its cloud save and clears its progress in this browser. Guest progress and exports on other devices remain until you delete them there.</p><div className="row account-actions"><button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => ask('Permanently delete your cloud save? Local progress will remain.', deleteCloudProgress, 'Cloud save deleted.')}>Delete cloud save</button><button type="button" className="btn btn-ghost" disabled={disabled} onClick={() => ask('Permanently delete your WhatisAI account and its cloud save? Google will ask you to confirm your identity.', removeAccount, 'Your account and cloud save were deleted.')}>Delete account</button></div></details>
    </div>}
    <div aria-live="polite" aria-atomic="true" className={`account-feedback ${failed || account.error ? 'account-error' : ''}`}>{busy ? 'Working…' : message || account.error}</div>
  </div>;
}
