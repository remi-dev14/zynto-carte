/* Zynto — fonctions partagées entre le front office (index.html) et le back office (admin.html) */
(function (global) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const digits = n => String(n).replace(/[^\d+]/g, '');
  const clone = o => JSON.parse(JSON.stringify(o));

  const DEFAULT_CARD = {
    nom: 'ANDRIAHENINTSOA', prenom: 'Zoniaina Rémi', poste: 'Développeur Full-Stack', showPoste: true,
    emails: ['zynto.servicemg@gmail.com', 'andriahenintsoaremizoniaina@gmail.com'],
    phones: [{ n: '+261 34 90 697 20', wa: true }, { n: '+261 37 20 818 24', wa: false }],
    photo: ''
  };

  const I = {
    z: '<svg viewBox="0 0 100 110" aria-hidden="true"><defs><linearGradient id="zg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#00C6FB"/><stop offset=".55" stop-color="#1A8CF5"/><stop offset="1" stop-color="#0A5CF5"/></linearGradient></defs><path fill="url(#zg)" d="M8 0H100V20L40 86H100V102L92 110H0V90L60 24H0V8Z"/><path fill="#fff" fill-opacity=".14" d="M60 24L100 20 40 86 0 90Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
  };

  const initials = d => (((d.prenom || '').trim()[0] || '') + ((d.nom || '').trim()[0] || '')).toUpperCase();

  function cardHTML(d) {
    const ph = d.photo
      ? `<img src="${esc(d.photo)}" alt="Photo de ${esc(d.prenom)} ${esc(d.nom)}">`
      : `<div aria-hidden="true">${esc(initials(d))}</div>`;
    const emails = (d.emails || []).filter(e => e.trim()).map(e => `
      <li class="c-row"><span class="c-ico">${I.mail}</span>
        <a class="c-val" href="mailto:${esc(e)}">${esc(e)}</a>
        <button class="copy" type="button" data-copy="${esc(e)}" aria-label="Copier ${esc(e)}">${I.copy}</button></li>`).join('');
    const phones = (d.phones || []).filter(p => p.n.trim()).map(p => `
      <li class="c-row"><span class="c-ico">${I.phone}</span>
        <a class="c-val" href="tel:${esc(digits(p.n))}">${esc(p.n)}</a>
        ${p.wa ? `<a class="wa" href="https://wa.me/${esc(digits(p.n).replace('+', ''))}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(p.n)}">${I.wa}</a>` : ''}
        <button class="copy" type="button" data-copy="${esc(p.n)}" aria-label="Copier ${esc(p.n)}">${I.copy}</button></li>`).join('');
    return `<article class="card" aria-label="Carte de visite">
      <div class="c-head"><span class="c-logo">${I.z}Zynto</span><span class="c-tag">Services IT · MG</span></div>
      <div class="c-id">
        <div class="photo">${ph}</div>
        <div class="c-first">${esc(d.prenom)}</div>
        <div class="c-last">${esc(d.nom)}</div>
        ${d.showPoste && (d.poste || '').trim() ? `<div class="c-role">${esc(d.poste)}</div>` : ''}
      </div>
      <div class="c-sep"></div>
      <ul class="c-list">${emails}${phones}</ul>
      <div class="c-foot">Antananarivo · Madagascar</div>
    </article>`;
  }

  function vcard(d, photoB64) {
    const e = s => String(s).replace(/([,;\\])/g, '\\$1');
    const L = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(d.nom)};${e(d.prenom)};;;`, `FN:${e(d.prenom)} ${e(d.nom)}`, 'ORG:Zynto'];
    if (d.showPoste && (d.poste || '').trim()) L.push(`TITLE:${e(d.poste)}`);
    (d.emails || []).filter(x => x.trim()).forEach(x => L.push(`EMAIL;TYPE=INTERNET:${x.trim()}`));
    (d.phones || []).filter(p => p.n.trim()).forEach(p => L.push(`TEL;TYPE=CELL:${digits(p.n)}`));
    if (photoB64) L.push('PHOTO;ENCODING=b;TYPE=JPEG:' + photoB64);
    L.push('END:VCARD');
    return L.join('\r\n');
  }

  function qrImg(text) {
    if (typeof qrcode !== 'function') return '<p>Le QR code n\'a pas pu se charger.</p>';
    try { const q = qrcode(0, 'L'); q.addData(unescape(encodeURIComponent(text))); q.make(); return q.createImgTag(6, 0, 'QR code du contact'); }
    catch (e) { return '<p>QR code indisponible.</p>'; }
  }

  let tt;
  function toast(t) {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = t; el.classList.add('on'); clearTimeout(tt);
    tt = setTimeout(() => el.classList.remove('on'), 1800);
  }

  function copyText(t, btn) {
    const fallback = () => {
      const v = btn && btn.closest('.c-row') && btn.closest('.c-row').querySelector('.c-val');
      if (!v) return;
      const r = document.createRange(); r.selectNodeContents(v);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      toast('Texte sélectionné, copiez-le');
    };
    try { navigator.clipboard.writeText(t).then(() => toast('Copié'), fallback); } catch (e) { fallback(); }
  }

  global.Zynto = { esc, digits, clone, DEFAULT_CARD, I, initials, cardHTML, vcard, qrImg, toast, copyText };
})(window);
