(() => {
  'use strict';
  const form = document.getElementById('calculator');
  const output = document.getElementById('result');
  if (!form || !output) return;
  const en = form.dataset.lang === 'en';
  const words = en ? {
    result: 'Result', normal: 'Normal text (AA)', large: 'Large text (AA)', pass: 'Meets threshold', fail: 'Below threshold',
    example: 'Preview of this color pair', invalid: 'Enter a six-digit HEX color such as #5632A8.',
    dark2: 'Darker 2 steps', dark1: 'Darker 1 step', base: 'Base', light1: 'Lighter 1 step', light2: 'Lighter 2 steps',
    onWhite: 'On white', onBlack: 'On black', note: 'Ratios describe solid pairs. Test the final design in context.'
  } : {
    result: 'Hasil', normal: 'Teks biasa (AA)', large: 'Teks besar (AA)', pass: 'Memenuhi ambang', fail: 'Di bawah ambang',
    example: 'Contoh pasangan warna ini', invalid: 'Masukkan warna HEX enam digit seperti #5632A8.',
    dark2: 'Lebih gelap 2 langkah', dark1: 'Lebih gelap 1 langkah', base: 'Dasar', light1: 'Lebih terang 1 langkah', light2: 'Lebih terang 2 langkah',
    onWhite: 'Pada putih', onBlack: 'Pada hitam', note: 'Rasio menjelaskan pasangan solid. Uji rancangan akhir pada konteks nyata.'
  };
  const parse = value => /^#[\da-fA-F]{6}$/.test(value.trim()) ? value.trim().toUpperCase() : null;
  const channels = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const linear = value => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = hex => {
    const [r, g, b] = channels(hex).map(linear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const fmt = n => `${n.toFixed(2)}:1`;
  const element = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const reset = () => { output.replaceChildren(element('h2', '', words.result)); };
  const error = () => { reset(); output.append(element('p', 'error', words.invalid)); };
  const hex = name => parse(form.elements[name].value);
  const mix = (base, target, fraction) => '#'+channels(base).map(channel => {
    const result = Math.round(channel * (1 - fraction) + target * fraction);
    return Math.max(0, Math.min(255, result)).toString(16).padStart(2, '0').toUpperCase();
  }).join('');
  function contrast() {
    const fg = hex('foreground'), bg = hex('background');
    if (!fg || !bg) return error();
    const exact = ratio(fg, bg);
    reset();
    const score = element('p', 'ratio', fmt(exact));
    output.append(score);
    for (const [label, limit] of [[words.normal, 4.5], [words.large, 3]]) {
      const line = element('p', 'verdict');
      line.append(element('strong', '', `${label}: `), element('span', exact >= limit ? 'pass' : 'fail', exact >= limit ? words.pass : words.fail));
      output.append(line);
    }
    const preview = element('div', 'preview', words.example);
    preview.style.color = fg;
    preview.style.backgroundColor = bg;
    output.append(preview, element('p', 'fineprint', `${fg} / ${bg} · ${words.note}`));
  }
  function palette() {
    const base = hex('base'), step = Number(form.elements.step.value);
    if (!base || !Number.isInteger(step) || step < 5 || step > 40) return error();
    const p = step / 100;
    const colors = [mix(base, 0, 2*p), mix(base, 0, p), base, mix(base, 255, p), mix(base, 255, 2*p)];
    const labels = [words.dark2, words.dark1, words.base, words.light1, words.light2];
    reset();
    const grid = element('div', 'palette-grid');
    colors.forEach((color, i) => {
      const card = element('div', 'palette-card');
      const swatch = element('div', 'palette-swatch', color);
      swatch.style.backgroundColor = color;
      swatch.style.color = ratio(color, '#FFFFFF') >= ratio(color, '#000000') ? '#FFFFFF' : '#000000';
      card.append(element('strong', '', labels[i]), swatch,
        element('span', '', `${words.onWhite}: ${fmt(ratio(color, '#FFFFFF'))}`),
        element('span', '', `${words.onBlack}: ${fmt(ratio(color, '#000000'))}`));
      grid.append(card);
    });
    output.append(grid, element('p', 'fineprint', words.note));
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.dataset.tool === 'contrast') contrast(); else palette();
    if (typeof window.gtag === 'function') window.gtag('event', 'tool_calculate', {tool_name: form.dataset.tool, page_language: form.dataset.lang});
  });
})();
