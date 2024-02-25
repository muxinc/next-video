const getColorPreference = () => {
  if (globalThis.localStorage?.getItem('theme-preference')) {
    return localStorage.getItem('theme-preference');
  } else {
    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
};

const setPreference = () => {
  localStorage.setItem('theme-preference', `${theme.value}`);
  reflectPreference();
};

const reflectPreference = () => {
  globalThis.document?.firstElementChild?.setAttribute('data-theme', `${theme.value}`);
  globalThis.document?.querySelector('#theme-toggle')?.setAttribute('aria-label', `${theme.value}`);
};

const theme = {
  value: getColorPreference(),
};

reflectPreference();

globalThis.onload = () => {
  reflectPreference();

  document.querySelector('#theme-toggle')?.addEventListener('click', (e) => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    setPreference();
  });
};

globalThis
  .matchMedia?.('(prefers-color-scheme: dark)')
  .addEventListener('change', ({ matches: isDark }) => {
    theme.value = isDark ? 'dark' : 'light';
    setPreference();
  });
