/* Zynto — back office : édite data/card.json et data/photo.jpg via l'API GitHub (commit direct). */
(function () {
  const Z = window.Zynto, I = Z.I, esc = Z.esc;
  const API = 'https://api.github.com';
  const CARD_PATH = 'data/card.json', PHOTO_PATH = 'data/photo.jpg';
  const app = document.getElementById('app');

  // Dépôt déduit de l'URL GitHub Pages (<owner>.github.io/<repo>/), modifiable à la connexion
  const guess = (() => {
    const h = location.hostname.match(/^([^.]+)\.github\.io$/);
    const r = location.pathname.split('/').filter(Boolean)[0];
    return h ? `${h[1]}/${r && !r.endsWith('.html') ? r : h[1] + '.github.io'}` : 'remi-dev14/zynto-carte';
  })();

  const store = {
    get(k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set(k, v, remember) { try { (remember ? localStorage : sessionStorage).setItem(k, v); } catch (e) {} },
    clear() { try { ['zt', 'zr', 'zb'].forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); }); } catch (e) {} }
  };

  let cfg = { token: store.get('zt'), repo: store.get('zr') || guess, branch: store.get('zb') || 'main' };
  let saved = null, draft = null, cardSha = null, newPhoto = null, busy = false;

  const b64enc = s => btoa(unescape(encodeURIComponent(s)));
  const b64dec = s => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));

  async function gh(path, opts = {}) {
    const r = await fetch(`${API}/repos/${cfg.repo}/${path}`, {
      ...opts,
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${cfg.token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) }
    });
    if (r.status === 404 && opts.allow404) return null;
    if (!r.ok) { const e = new Error((await r.json().catch(() => ({}))).message || r.statusText); e.status = r.status; throw e; }
    return r.json();
  }

  function errText(e) {
    if (e.status === 401) return 'Jeton refusé. Vérifiez qu\'il est valide et non expiré.';
    if (e.status === 403) return 'Ce jeton n\'a pas le droit d\'écrire dans ce dépôt (permission « Contents : Read and write »).';
    if (e.status === 404) return 'Dépôt ou branche introuvable. Vérifiez « propriétaire/dépôt » et la branche.';
    if (e.status === 409) return 'Le fichier a changé entre-temps. Rechargez la page puis recommencez.';
    return 'Erreur GitHub : ' + e.message;
  }

  /* ---------- Connexion ---------- */
  function loginHTML(msg) {
    return `
      <div class="topbar"><span class="brand">${I.z}Zynto <small>Back office</small></span>
        <a class="btn sm ghost" href="./">Voir la carte</a></div>
      <form class="panel login" id="login" novalidate>
        <h2>Connexion</h2>
        <p class="hint">Le back office enregistre vos modifications directement dans le dépôt GitHub.
          Il faut un <strong>jeton d'accès personnel</strong> (fine-grained) limité à ce dépôt, avec la permission
          <em>Contents : Read and write</em>.
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Créer un jeton</a></p>
        <div class="grid2">
          <label class="f">Dépôt<input type="text" id="repo" value="${esc(cfg.repo)}" placeholder="propriétaire/dépôt" autocomplete="off"></label>
          <label class="f">Branche<input type="text" id="branch" value="${esc(cfg.branch)}" autocomplete="off"></label>
        </div>
        <label class="f">Jeton GitHub<input type="password" id="token" value="" placeholder="github_pat_…" autocomplete="off"></label>
        <label class="chk"><input type="checkbox" id="remember">Rester connecté sur cet appareil</label>
        <div class="bar"><span class="status ${msg ? 'err' : ''}" id="status">${esc(msg || '')}</span>
          <button class="btn primary" type="submit">Se connecter</button></div>
      </form>`;
  }

  async function connect(remember) {
    const data = await gh(`contents/${CARD_PATH}?ref=${encodeURIComponent(cfg.branch)}`, { allow404: true });
    cardSha = data ? data.sha : null;
    saved = Object.assign(Z.clone(Z.DEFAULT_CARD), data ? JSON.parse(b64dec(data.content)) : {});
    draft = Z.clone(saved); newPhoto = null;
    store.set('zt', cfg.token, remember); store.set('zr', cfg.repo, remember); store.set('zb', cfg.branch, remember);
    renderEditor();
  }

  /* ---------- Éditeur ---------- */
  function previewCard() {
    const d = Z.clone(draft);
    if (newPhoto) d.photo = newPhoto;
    return Z.cardHTML(d);
  }

  function editorHTML() {
    const d = draft, photo = newPhoto || d.photo;
    const em = d.emails.map((e, i) => `<div class="lrow">
        <input type="email" id="em${i}" data-k="email" data-i="${i}" value="${esc(e)}" placeholder="adresse@exemple.com" aria-label="Email ${i + 1}">
        <button class="iconbtn" type="button" data-del="email" data-i="${i}" aria-label="Retirer cet email">${I.x}</button></div>`).join('');
    const ph = d.phones.map((p, i) => `<div class="lrow">
        <input type="tel" id="ph${i}" data-k="phone" data-i="${i}" value="${esc(p.n)}" placeholder="+261 …" aria-label="Téléphone ${i + 1}">
        <label class="chk"><input type="checkbox" id="wa${i}" data-k="wa" data-i="${i}" ${p.wa ? 'checked' : ''}>WhatsApp</label>
        <button class="iconbtn" type="button" data-del="phone" data-i="${i}" aria-label="Retirer ce numéro">${I.x}</button></div>`).join('');
    return `
      <div class="topbar"><span class="brand">${I.z}Zynto <small>Back office · ${esc(cfg.repo)}</small></span>
        <div class="tb-actions"><a class="btn sm ghost" href="./" target="_blank" rel="noopener">Voir la carte</a>
        <button class="btn sm ghost" type="button" id="logout">Déconnexion</button></div></div>
      <div class="bo">
        <form class="panel" id="form" novalidate>
          <h2>Modifier la carte</h2>
          <div><h3>Photo</h3><div class="photo-ed">
            <div class="thumb">${photo ? `<img src="${esc(photo)}" alt="">` : esc(Z.initials(d))}</div>
            <label class="btn sm" for="photoIn">${photo ? 'Remplacer la photo' : 'Choisir une photo'}</label>
            <input type="file" id="photoIn" accept="image/*" hidden>
            ${photo ? `<button class="btn sm ghost" type="button" id="photoDel">Retirer</button>` : ''}
          </div></div>
          <div><h3>Identité</h3><div class="grid2">
            <label class="f">Nom<input type="text" id="nom" data-k="nom" value="${esc(d.nom)}"></label>
            <label class="f">Prénom<input type="text" id="prenom" data-k="prenom" value="${esc(d.prenom)}"></label>
          </div></div>
          <div><h3>Poste</h3><div class="stack">
            <input type="text" id="poste" data-k="poste" value="${esc(d.poste)}" placeholder="Facultatif" aria-label="Poste">
            <label class="chk"><input type="checkbox" id="showPoste" data-k="showPoste" ${d.showPoste ? 'checked' : ''}>Afficher le poste sur la carte</label>
          </div></div>
          <div><h3>Emails</h3><div class="stack">${em}
            <button class="btn sm ghost" type="button" id="addEmail" style="align-self:flex-start">${I.plus}Ajouter un email</button></div></div>
          <div><h3>Téléphones</h3><div class="stack">${ph}
            <button class="btn sm ghost" type="button" id="addPhone" style="align-self:flex-start">${I.plus}Ajouter un numéro</button></div></div>
          <div class="bar"><span class="status" id="status"></span>
            <button class="btn" type="button" id="cancel">Annuler</button>
            <button class="btn primary" type="submit" id="save">Enregistrer</button></div>
        </form>
        <div class="preview"><span class="lbl">Aperçu en direct</span><div id="prev">${previewCard()}</div></div>
      </div>`;
  }

  function renderLogin(msg) { app.innerHTML = loginHTML(msg); }
  function renderEditor() { app.innerHTML = editorHTML(); }
  const refreshPreview = () => { const p = document.getElementById('prev'); if (p) p.innerHTML = previewCard(); };
  function setStatus(t, cls) { const s = document.getElementById('status'); if (s) { s.textContent = t; s.className = 'status' + (cls ? ' ' + cls : ''); } }

  /* Redimensionne et recadre la photo en carré 480 px (JPEG) */
  function loadPhoto(file) {
    return new Promise((res, rej) => {
      if (!file || !file.type.startsWith('image/')) return rej(new Error('type'));
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const S = 480, c = document.createElement('canvas'); c.width = c.height = S;
        const m = Math.min(img.width, img.height);
        c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('lecture')); };
      img.src = url;
    });
  }

  async function save() {
    if (busy) return;
    const d = Z.clone(draft);
    d.nom = d.nom.trim().toUpperCase(); d.prenom = d.prenom.trim(); d.poste = d.poste.trim();
    d.emails = d.emails.map(e => e.trim()).filter(Boolean);
    d.phones = d.phones.map(p => ({ n: p.n.trim(), wa: !!p.wa })).filter(p => p.n);
    if (!d.nom || !d.prenom) return setStatus('Le nom et le prénom sont obligatoires.', 'err');
    const bad = d.emails.find(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (bad) return setStatus(`Adresse invalide : ${bad}`, 'err');

    busy = true; document.getElementById('save').disabled = true;
    try {
      if (newPhoto) {
        setStatus('Envoi de la photo…');
        const cur = await gh(`contents/${PHOTO_PATH}?ref=${encodeURIComponent(cfg.branch)}`, { allow404: true });
        const res = await gh(`contents/${PHOTO_PATH}`, { method: 'PUT', body: JSON.stringify({
          message: 'Mise à jour de la photo de la carte', branch: cfg.branch,
          content: newPhoto.split(',')[1], ...(cur ? { sha: cur.sha } : {}) }) });
        d.photo = `${PHOTO_PATH}?v=${res.content.sha.slice(0, 8)}`;
      }
      setStatus('Enregistrement…');
      const res = await gh(`contents/${CARD_PATH}`, { method: 'PUT', body: JSON.stringify({
        message: 'Mise à jour de la carte de visite', branch: cfg.branch,
        content: b64enc(JSON.stringify(d, null, 2) + '\n'), ...(cardSha ? { sha: cardSha } : {}) }) });
      cardSha = res.content.sha; saved = d; draft = Z.clone(d); newPhoto = null;
      renderEditor();
      setStatus('Enregistré. La carte publique se met à jour d\'ici une minute environ.', 'ok');
    } catch (e) {
      setStatus(errText(e), 'err');
    } finally {
      busy = false; const b = document.getElementById('save'); if (b) b.disabled = false;
    }
  }

  /* ---------- Événements ---------- */
  app.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (ev.target.id === 'form') return save();
    if (ev.target.id === 'login') {
      cfg = { repo: document.getElementById('repo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, ''),
              branch: document.getElementById('branch').value.trim() || 'main',
              token: document.getElementById('token').value.trim() };
      if (!/^[\w.-]+\/[\w.-]+$/.test(cfg.repo)) return setStatus('Indiquez le dépôt sous la forme propriétaire/dépôt.', 'err');
      if (!cfg.token) return setStatus('Collez votre jeton GitHub.', 'err');
      setStatus('Connexion…');
      try { await connect(document.getElementById('remember').checked); }
      catch (e) { setStatus(errText(e), 'err'); }
    }
  });

  app.addEventListener('click', ev => {
    const t = ev.target.closest('button,a'); if (!t) return;
    if (t.dataset.copy !== undefined) { Z.copyText(t.dataset.copy, t); return; }
    switch (t.id) {
      case 'logout': store.clear(); cfg.token = ''; renderLogin(); return;
      case 'cancel': draft = Z.clone(saved); newPhoto = null; renderEditor(); setStatus('Modifications annulées'); return;
      case 'addEmail': draft.emails.push(''); renderEditor(); document.getElementById('em' + (draft.emails.length - 1)).focus(); return;
      case 'addPhone': draft.phones.push({ n: '', wa: false }); renderEditor(); document.getElementById('ph' + (draft.phones.length - 1)).focus(); return;
      case 'photoDel': draft.photo = ''; newPhoto = null; renderEditor(); setStatus('Modifications non enregistrées'); return;
    }
    if (t.dataset.del) {
      const i = +t.dataset.i;
      (t.dataset.del === 'email' ? draft.emails : draft.phones).splice(i, 1);
      renderEditor(); setStatus('Modifications non enregistrées');
    }
  });

  app.addEventListener('input', ev => {
    const el = ev.target, k = el.dataset && el.dataset.k; if (!k || !draft) return;
    const i = +el.dataset.i;
    if (k === 'email') draft.emails[i] = el.value;
    else if (k === 'phone') draft.phones[i].n = el.value;
    else if (k === 'wa') draft.phones[i].wa = el.checked;
    else if (k === 'showPoste') draft.showPoste = el.checked;
    else draft[k] = el.value;
    refreshPreview(); setStatus('Modifications non enregistrées');
  });

  app.addEventListener('change', async ev => {
    if (ev.target.id !== 'photoIn') return;
    try { newPhoto = await loadPhoto(ev.target.files[0]); renderEditor(); setStatus('Modifications non enregistrées'); }
    catch (e) { setStatus('Ce fichier n\'est pas une image lisible.', 'err'); }
  });

  window.addEventListener('beforeunload', ev => {
    if (draft && (newPhoto || JSON.stringify(draft) !== JSON.stringify(saved))) { ev.preventDefault(); ev.returnValue = ''; }
  });

  /* ---------- Démarrage ---------- */
  if (cfg.token) {
    app.innerHTML = `<p class="note">Connexion à ${esc(cfg.repo)}…</p>`;
    connect(!!(function () { try { return localStorage.getItem('zt'); } catch (e) { return ''; } })())
      .catch(e => renderLogin(errText(e)));
  } else renderLogin();
})();
