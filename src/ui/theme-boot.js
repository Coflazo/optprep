// Runs before first paint (classic script in <head>) so a saved Light/Dark choice never
// flashes the other theme. System is the default and needs no attribute.
try {
  const t = localStorage.getItem('optprep:theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch { /* storage blocked: follow the system theme */ }
