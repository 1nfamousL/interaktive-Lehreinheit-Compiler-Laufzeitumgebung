// terminal-zeile im hauptmeenü
// für screenreader ausgeblendet

const START_VERZOEGERUNG_MS = 600;

export function renderPrompt(container, config) {
  const { pfad, hervorgehoben = -1, befehl } = config;

  const zeile = document.createElement('div');
  zeile.className = 'tp';
  zeile.setAttribute('aria-hidden', 'true');

  const pfadEl = document.createElement('span');
  pfadEl.className = 'tp-pfad';
  pfadEl.append('~/');
  pfad.forEach((teil, i) => {
    const b = document.createElement('b');
    b.textContent = teil;
    if (i === hervorgehoben) b.className = 'tp-ich';
    pfadEl.append(b);
    if (i < pfad.length - 1) pfadEl.append('/');
  });

  const befehlEl = document.createElement('span');
  befehlEl.className = 'tp-befehl';
  const getippt = document.createElement('span');
  const cursor = document.createElement('span');
  cursor.className = 'tp-cursor';
  befehlEl.append('$ ', getippt, cursor);

  zeile.append(pfadEl, befehlEl);
  container.appendChild(zeile);

  // weniger bewegung eingestellt: befehl sofort komplett
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    getippt.textContent = befehl;
    return () => {};
  }

  // zeichen für zeichen mit zufälliger pause
  let timer = null;
  let i = 0;
  const tippe = () => {
    getippt.textContent = befehl.slice(0, ++i);
    if (i < befehl.length) timer = setTimeout(tippe, 70 + Math.random() * 60);
  };
  timer = setTimeout(tippe, START_VERZOEGERUNG_MS);

  return () => clearTimeout(timer);
}
