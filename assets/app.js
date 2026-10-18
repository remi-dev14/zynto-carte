/* Zynto — front office : affiche la carte à partir de data/card.json */
(function () {
  const Z = window.Zynto;
  let card = Z.clone(Z.DEFAULT_CARD);
  let qrOpen = false;

  const $ = id => document.getElementById(id);
  $('brand').insertAdjacentHTML('afterbegin', Z.I.z);
  $('addContact').innerHTML = Z.I.user + 'Ajouter aux contacts';
  $('shareBtn').innerHTML = Z.I.share + 'Partager la carte';

  function render() {
    $('card').innerHTML = Z.cardHTML(card);
    $('qrBtn').innerHTML = Z.I.qr + (qrOpen ? 'Masquer le QR' : 'QR code');
    $('qrBox').hidden = !qrOpen;
    if (qrOpen) $('qrBox').innerHTML = Z.qrImg(Z.vcard(card)) +
      '<p>Scannez avec l\'appareil photo pour enregistrer directement le contact.</p>';
  }

  async function photoBase64() {
    if (!card.photo) return '';
    try {
      const blob = await (await fetch(card.photo)).blob();
      return await new Promise(res => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.readAsDataURL(blob); });
    } catch (e) { return ''; }
  }

  $('addContact').addEventListener('click', async () => {
    const data = Z.vcard(card, await photoBase64());
    const blob = new Blob([data], { type: 'text/vcard;charset=utf-8' });
    const name = `${card.prenom.split(' ')[0]}-${card.nom}.vcf`.replace(/\s+/g, '-');
    const file = new File([blob], name, { type: 'text/vcard' });
    // Sur mobile, le partage natif ouvre directement l'app Contacts
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  $('qrBtn').addEventListener('click', () => { qrOpen = !qrOpen; render(); });

  $('shareBtn').addEventListener('click', async () => {
    const url = location.href.split('#')[0];
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); Z.toast('Lien copié'); } catch (e) { Z.toast(url); }
  });

  $('card').addEventListener('click', ev => {
    const b = ev.target.closest('[data-copy]');
    if (b) Z.copyText(b.dataset.copy, b);
  });

  render();
  fetch('data/card.json?t=' + Date.now(), { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => { card = Object.assign(Z.clone(Z.DEFAULT_CARD), d); render(); })
    .catch(() => { /* garde les valeurs par défaut */ });
})();
