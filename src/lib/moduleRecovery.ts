// Old tabs can request deleted chunks after a deployment. Reload at most once
// for that failed module; persistent deployment failures reach the error UI.
window.addEventListener('vite:preloadError', (event) => {
  const failure = event as Event & { payload?: unknown };
  const message = failure.payload instanceof Error
    ? failure.payload.message
    : String(failure.payload ?? 'module-load-error');
  const key = `qk-module-recovery:${window.location.pathname}:${message}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'attempted');
  } catch {
    // Without persistent session storage we cannot safely prevent reload loops.
    return;
  }
  event.preventDefault();
  window.location.reload();
});
