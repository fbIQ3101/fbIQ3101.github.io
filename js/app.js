/* ============================================================
   Blog – Anwendungslogik
   Reines JavaScript, keine Abhängigkeiten, läuft auf GitHub Pages.
   ============================================================ */
(() => {
  'use strict';

  /* ---------- Konfiguration ---------- */
  const CFG = Object.assign({
    BLOG_TITLE: 'Mein Blog',
    BLOG_TAGLINE: '',
    OWNER_DISPLAY_NAME: 'Blog-Owner',
    OWNER_USERNAME: 'admin',
    PASSWORD_SALT: '',
    OWNER_PASSWORD_SHA256: '',
    OWNER_SESSION_MINUTES: 120,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCK_SECONDS: 60
  }, window.BLOG_CONFIG || {});

  const K = {
    data: 'blog.data.v1',
    session: 'blog.session',
    theme: 'blog.theme',
    lock: 'blog.login-lock',
    exported: 'blog.exported-revision',
    lastViewer: 'blog.last-viewer-name'
  };

  /* ---------- Hilfsfunktionen ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
  const unesc = (s) => String(s).replace(/&(amp|lt|gt|quot|#39);/g, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e]);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const initial = (s) => ([...String(s || '?').trim()][0] || '?').toUpperCase();
  const hue = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const nowIso = () => new Date().toISOString();

  const mkStore = (getStorage) => ({
    get(k, f = null) { try { const v = getStorage().getItem(k); return v == null ? f : JSON.parse(v); } catch { return f; } },
    set(k, v) { try { getStorage().setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
    del(k) { try { getStorage().removeItem(k); } catch { /* ignorieren */ } }
  });
  const ls = mkStore(() => localStorage);
  const ss = mkStore(() => sessionStorage);

  /* ---------- Icons ---------- */
  const svg = (p) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
    logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-6.4 0-10-7-10-7a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A9.1 9.1 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20"/>'),
    edit: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    back: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
    arrow: svg('<path d="M5 12h14M12 5l7 7-7 7"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'),
    download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
    upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
    menu: svg('<path d="M3 6h18M3 12h18M3 18h18"/>'),
    x: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
    comment: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    send: svg('<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'),
    alert: svg('<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>'),
    link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    undo: svg('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>')
  };

  /* ---------- Datum & Status ---------- */
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const toDate = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00') : new Date(s));
  const fmtDate = (s) => { if (!s) return '–'; const d = toDate(s); return isNaN(d) ? '–' : d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }); };
  const fmtDateTime = (s) => { const d = new Date(s); return isNaN(d) ? '–' : d.toLocaleString('de-DE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr'; };
  const isLive = (p) => p.status === 'published' && (!p.publishedAt || p.publishedAt <= today());
  const statusOf = (p) => (p.status !== 'published' ? 'draft' : isLive(p) ? 'published' : 'scheduled');
  const STATUS = { published: ['Veröffentlicht', 'badge-ok'], draft: ['Entwurf', 'badge-draft'], scheduled: ['Geplant', 'badge-sched'] };
  const statusBadge = (p) => { const [t, c] = STATUS[statusOf(p)]; return `<span class="badge ${c}">${t}</span>`; };
  const readMin = (t) => Math.max(1, Math.round(String(t).replace(/!\[[^\]]*\]\([^)]*\)/g, '').split(/\s+/).filter(Boolean).length / 200));
  const sortPosts = (list) => [...list].sort((a, b) => (b.publishedAt || b.updatedAt || '').localeCompare(a.publishedAt || a.updatedAt || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  const commentCount = (id) => data.comments.filter((c) => c.postId === id).length;

  /* ---------- Daten ---------- */
  let data = null;

  function emptyData() {
    return {
      revision: 0,
      settings: { title: CFG.BLOG_TITLE, tagline: CFG.BLOG_TAGLINE, author: CFG.OWNER_DISPLAY_NAME },
      posts: [],
      comments: []
    };
  }

  function normalize(d) {
    const base = emptyData();
    if (!d || typeof d !== 'object') return base;
    const settings = Object.assign(base.settings, d.settings || {});
    return {
      revision: Number(d.revision) || 0,
      settings,
      posts: (Array.isArray(d.posts) ? d.posts : []).filter((p) => p && p.id).map((p) => ({
        id: String(p.id),
        title: String(p.title || ''),
        excerpt: String(p.excerpt || ''),
        content: String(p.content || ''),
        cover: String(p.cover || ''),
        category: String(p.category || ''),
        tags: Array.isArray(p.tags) ? p.tags.map(String).filter(Boolean) : [],
        author: String(p.author || settings.author),
        status: p.status === 'published' ? 'published' : 'draft',
        publishedAt: String(p.publishedAt || ''),
        createdAt: p.createdAt || nowIso(),
        updatedAt: p.updatedAt || p.createdAt || nowIso()
      })),
      comments: (Array.isArray(d.comments) ? d.comments : []).filter((c) => c && c.id && c.postId).map((c) => ({
        id: String(c.id),
        postId: String(c.postId),
        name: String(c.name || 'Gast'),
        role: c.role === 'owner' ? 'owner' : 'viewer',
        text: String(c.text || ''),
        createdAt: c.createdAt || nowIso()
      }))
    };
  }

  const repoRevision = () => Number(window.BLOG_DATA && window.BLOG_DATA.revision) || 0;

  /* Neuere Version (lokal oder im Repository) gewinnt; lokale Kommentare bleiben erhalten */
  function loadData() {
    const repo = normalize(window.BLOG_DATA);
    const local = ls.get(K.data, null);
    if (local && (Number(local.revision) || 0) >= repo.revision) return normalize(local);
    if (local && Array.isArray(local.comments)) {
      const ids = new Set(repo.comments.map((c) => c.id));
      const postIds = new Set(repo.posts.map((p) => p.id));
      normalize(local).comments.forEach((c) => { if (!ids.has(c.id) && postIds.has(c.postId)) repo.comments.push(c); });
      ls.set(K.data, repo);
    }
    return repo;
  }

  /* bump = true: Owner-Änderung (neue Revision) */
  function persist(bump = true) {
    if (bump) data.revision = Math.max(Date.now(), data.revision + 1);
    if (!ls.set(K.data, data)) {
      toast('Speichern fehlgeschlagen: Der Browser-Speicher ist voll. Verwende kleinere Bilder oder Bild-Links.', 'error');
      return false;
    }
    return true;
  }

  const hasUnexported = () => data.revision > Math.max(repoRevision(), Number(ls.get(K.exported, 0)) || 0);

  /* ---------- Markdown (sicher: erst escapen, dann formatieren) ---------- */
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^(https?:|mailto:)/i.test(u)) return '';
    if (/^\/\//.test(u)) return 'https:' + u;
    return u;
  }

  function inline(s) {
    return s
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => { const u = safeUrl(unesc(url)); return u ? `<img src="${esc(u)}" alt="${alt}" loading="lazy">` : ''; })
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, url) => { const u = safeUrl(unesc(url)); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${t}</a>` : t; })
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  }

  function md(src) {
    const lines = esc(String(src || '').replace(/\r\n?/g, '\n')).split('\n');
    const out = [];
    let para = [], list = null, quote = [], code = null;
    const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join('<br>'))}</p>`); para = []; } };
    const flushList = () => { if (list) { out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`); list = null; } };
    const flushQuote = () => { if (quote.length) { out.push(`<blockquote><p>${inline(quote.join('<br>'))}</p></blockquote>`); quote = []; } };
    const flush = () => { flushPara(); flushList(); flushQuote(); };
    const pushItem = (type, text) => { flushPara(); flushQuote(); if (!list || list.type !== type) { flushList(); list = { type, items: [] }; } list.items.push(text); };

    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      if (code) { if (/^```/.test(line)) { out.push(`<pre><code>${code.join('\n')}</code></pre>`); code = null; } else code.push(raw); continue; }
      if (/^```/.test(line)) { flush(); code = []; continue; }
      if (!line.trim()) { flush(); continue; }
      let m;
      if ((m = line.match(/^(#{1,3})\s+(.+)$/))) { flush(); const l = m[1].length === 3 ? 3 : 2; out.push(`<h${l}>${inline(m[2])}</h${l}>`); continue; }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { flush(); out.push('<hr>'); continue; }
      if ((m = line.match(/^&gt;\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); continue; }
      if ((m = line.match(/^\s*[-*•]\s+(.+)$/))) { pushItem('ul', m[1]); continue; }
      if ((m = line.match(/^\s*\d+[.)]\s+(.+)$/))) { pushItem('ol', m[1]); continue; }
      if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
        flush();
        const u = safeUrl(unesc(m[2]));
        if (u) out.push(`<figure><img src="${esc(u)}" alt="${m[1]}" loading="lazy">${m[1] ? `<figcaption>${m[1]}</figcaption>` : ''}</figure>`);
        continue;
      }
      flushList(); flushQuote(); para.push(line);
    }
    if (code) out.push(`<pre><code>${code.join('\n')}</code></pre>`);
    flush();
    return out.join('\n');
  }

  /* ---------- UI-Bausteine ---------- */
  const avatar = (name, cls = '') => `<span class="avatar ${cls}" style="--h:${hue(name)}" aria-hidden="true">${esc(initial(name))}</span>`;
  const coverHtml = (p) => {
    const u = safeUrl(p.cover);
    return u ? `<img src="${esc(u)}" alt="" loading="lazy">` : `<div class="placeholder" style="--h:${hue(p.title || p.id)}"><span>${esc(initial(p.title || '?'))}</span></div>`;
  };

  function toast(msg, type = 'info') {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `<span class="toast-dot"></span><span>${esc(msg)}</span>`;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, type === 'error' ? 4800 : 3400);
  }

  const modalRoot = () => $('#modal-root');

  function openModal({ title, titleHtml = '', body, foot = '', wide = false, onClose }) {
    const prevFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><h2 class="modal-title">${esc(title)}${titleHtml}</h2>
          <button class="btn btn-ghost icon-btn" data-close aria-label="Schließen">${I.x}</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    modalRoot().appendChild(wrap);
    document.body.classList.add('no-scroll');

    const onKey = (e) => {
      if (wrap !== modalRoot().lastElementChild) return;
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Tab') {
        const f = $$('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])', wrap).filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    function close(result) {
      if (wrap.dataset.closing) return;
      wrap.dataset.closing = '1';
      wrap.classList.add('closing');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        wrap.remove();
        if (!modalRoot().children.length) document.body.classList.remove('no-scroll');
        if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
        if (onClose) onClose(result);
      }, 180);
    }
    wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(false); });
    document.addEventListener('keydown', onKey);
    setTimeout(() => { const f = $('[data-autofocus]', wrap) || $('.modal-foot .btn', wrap) || $('[data-close]', wrap); if (f) f.focus(); }, 40);
    return { el: wrap, close };
  }

  function confirmDialog({ title, text, confirm = 'Bestätigen', danger = false }) {
    return new Promise((resolve) => {
      const m = openModal({
        title,
        body: `<p class="muted">${esc(text)}</p>`,
        foot: `<button class="btn" data-close>Abbrechen</button><button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'}" data-ok data-autofocus>${esc(confirm)}</button>`,
        onClose: (r) => resolve(!!r)
      });
      $('[data-ok]', m.el).onclick = () => m.close(true);
    });
  }

  /* ---------- Design (hell/dunkel) ---------- */
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  const themeIcon = () => (isDark() ? I.sun : I.moon);
  const themeLabel = () => (isDark() ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren');
  const themeBtn = (cls = '') => `<button class="btn btn-ghost icon-btn ${cls}" data-theme-toggle aria-label="${themeLabel()}" title="${themeLabel()}">${themeIcon()}</button>`;

  function setTheme(t) {
    const html = document.documentElement;
    html.classList.add('theme-anim');
    html.dataset.theme = t;
    try { localStorage.setItem(K.theme, t); } catch { /* ignorieren */ }
    clearTimeout(setTheme.timer);
    setTheme.timer = setTimeout(() => html.classList.remove('theme-anim'), 450);
    $$('[data-theme-toggle]').forEach((b) => { b.innerHTML = themeIcon(); b.setAttribute('aria-label', themeLabel()); b.title = themeLabel(); });
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-theme-toggle]')) setTheme(isDark() ? 'light' : 'dark'); });

  /* ---------- Sitzung ---------- */
  let sessionExpired = false;

  function getSession() {
    const s = ss.get(K.session);
    if (!s || !s.role || !s.name) return null;
    if (s.role === 'owner') {
      if (Date.now() > (s.expires || 0)) { ss.del(K.session); sessionExpired = true; return null; }
      s.expires = Date.now() + CFG.OWNER_SESSION_MINUTES * 60000;
      ss.set(K.session, s);
    }
    return s;
  }
  const isOwner = () => (getSession() || {}).role === 'owner';

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /* ---------- Navigation ---------- */
  let editorDirty = false;
  let lastHash = location.hash;

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  window.addEventListener('hashchange', async () => {
    if (editorDirty && getSession()) {
      const target = location.hash;
      history.replaceState(null, '', location.pathname + location.search + lastHash);
      const ok = await confirmDialog({
        title: 'Ungespeicherte Änderungen',
        text: 'Du hast Änderungen, die noch nicht gespeichert sind. Möchtest du die Seite trotzdem verlassen?',
        confirm: 'Verwerfen & verlassen',
        danger: true
      });
      if (!ok) return;
      editorDirty = false;
      history.replaceState(null, '', location.pathname + location.search + target);
    }
    route();
  });

  window.addEventListener('beforeunload', (e) => { if (editorDirty) { e.preventDefault(); e.returnValue = ''; } });

  function route() {
    const s = getSession();
    if (!s) {
      editorDirty = false;
      if (sessionExpired) { sessionExpired = false; toast('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.', 'error'); }
      renderGate();
      return;
    }
    editorDirty = false;
    lastHash = location.hash;
    let parts = [];
    try { parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent); } catch { parts = []; }
    const [a, b] = parts;
    const owner = s.role === 'owner';

    if (!a) return viewBlog();
    if (a === 'beitrag' && b) return viewPost(b);
    if ((a === 'dashboard' || a === 'editor') && !owner) {
      toast('Dieser Bereich ist nur für den Owner zugänglich.', 'error');
      history.replaceState(null, '', location.pathname + location.search + '#/');
      return viewBlog();
    }
    if (a === 'dashboard') return viewDashboard(b || 'beitraege');
    if (a === 'editor') return viewEditor(b && b !== 'neu' ? b : null);
    viewNotFound();
  }

  /* ---------- Anmeldung (Owner / Viewer) ---------- */
  function renderGate(step = 'choose') {
    const live = data.posts.filter(isLive);
    const cats = new Set(live.map((p) => p.category).filter(Boolean));
    document.title = `Anmelden · ${data.settings.title}`;
    $('#root').innerHTML = `
      <div class="gate">
        ${themeBtn('gate-theme')}
        <section class="gate-hero">
          <div class="orbs" aria-hidden="true"><i></i><i></i><i></i></div>
          <span class="brand" style="position:relative;z-index:1"><span class="brand-mark">${esc(initial(data.settings.title))}</span><span class="brand-text">${esc(data.settings.title)}</span></span>
          <div class="gate-hero-inner">
            <span class="eyebrow">Willkommen</span>
            <h1 class="display">${esc(data.settings.title)}</h1>
            <p class="lead">${esc(data.settings.tagline)}</p>
            <div class="gate-stats">
              <span><b>${live.length}</b>${live.length === 1 ? 'Beitrag' : 'Beiträge'}</span>
              <span><b>${cats.size}</b>${cats.size === 1 ? 'Kategorie' : 'Kategorien'}</span>
            </div>
          </div>
        </section>
        <section class="gate-panel" id="app">
          <div class="gate-card" id="gate-card"></div>
        </section>
      </div>`;
    showGateStep(step);
  }

  const GATE = {
    choose: () => `
      <h2>Wie möchtest du fortfahren?</h2>
      <p class="muted">Wähle deine Rolle, um den Blog zu betreten.</p>
      <div class="role-grid">
        <button class="role" data-step="viewer" style="--d:0">
          <span class="role-icon">${I.user}</span><strong>Als Viewer lesen</strong>
          <span class="desc">Beiträge lesen und kommentieren – ganz ohne Konto oder Passwort.</span>
          <span class="arrow">${I.arrow}</span>
        </button>
        <button class="role" data-step="owner" style="--d:1">
          <span class="role-icon">${I.shield}</span><strong>Als Owner anmelden</strong>
          <span class="desc">Beiträge schreiben, veröffentlichen und den Blog verwalten.</span>
          <span class="arrow">${I.arrow}</span>
        </button>
      </div>`,

    viewer: () => `
      <button class="link-back" data-step="choose">${I.back} Zurück</button>
      <h2>Blog betreten</h2>
      <p class="muted">Kein Passwort, kein Konto – gib einfach einen Namen ein. Er wird bei deinen Kommentaren angezeigt.</p>
      <form id="viewer-form" novalidate>
        <label class="field"><span>Anzeigename</span>
          <input class="input" id="viewer-name" maxlength="30" autocomplete="nickname" placeholder="z. B. Lena" value="${esc(ls.get(K.lastViewer, ''))}" required>
        </label>
        <p class="form-error" id="viewer-error" role="alert"></p>
        <button class="btn btn-primary btn-block" type="submit">Blog betreten ${I.arrow}</button>
      </form>
      <p class="gate-hint">${I.info}<span>Dein Name bleibt nur für diese Sitzung gespeichert.</span></p>`,

    owner: () => `
      <button class="link-back" data-step="choose">${I.back} Zurück</button>
      <h2>Owner-Anmeldung</h2>
      <p class="muted">Melde dich an, um auf das Dashboard zuzugreifen.</p>
      <form id="owner-form" novalidate>
        <label class="field"><span>Benutzername</span>
          <input class="input" id="ow-user" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Benutzername">
        </label>
        <label class="field"><span>Passwort</span>
          <span class="pw-wrap">
            <input class="input" id="ow-pass" type="password" autocomplete="current-password" placeholder="Passwort">
            <button type="button" class="pw-toggle" id="pw-toggle" aria-label="Passwort anzeigen" title="Passwort anzeigen">${I.eye}</button>
          </span>
        </label>
        <p class="form-error" id="ow-error" role="alert"></p>
        <button class="btn btn-primary btn-block" id="ow-submit" type="submit">Anmelden</button>
      </form>
      <p class="gate-hint">${I.shield}<span>Nach ${CFG.MAX_LOGIN_ATTEMPTS} Fehlversuchen wird die Anmeldung kurz gesperrt. Du wirst nach ${CFG.OWNER_SESSION_MINUTES} Minuten Inaktivität automatisch abgemeldet.</span></p>`
  };

  function showGateStep(step) {
    const card = $('#gate-card');
    card.innerHTML = GATE[step]();
    card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
    $$('[data-step]', card).forEach((b) => (b.onclick = () => showGateStep(b.dataset.step)));

    if (step === 'viewer') {
      const input = $('#viewer-name');
      setTimeout(() => input.focus(), 60);
      $('#viewer-form').onsubmit = (e) => {
        e.preventDefault();
        const name = input.value.trim().replace(/\s+/g, ' ');
        const err = (msg) => { $('#viewer-error').textContent = msg; input.closest('.field').classList.add('invalid'); shake(); input.focus(); };
        if (!name) return err('Bitte gib einen Anzeigenamen ein.');
        if (name.length < 2) return err('Der Name muss mindestens 2 Zeichen lang sein.');
        if (name.length > 30) return err('Der Name darf höchstens 30 Zeichen lang sein.');
        const reserved = [CFG.OWNER_USERNAME, CFG.OWNER_DISPLAY_NAME, data.settings.author, 'owner', 'admin', 'administrator'].map((x) => String(x).toLowerCase());
        if (reserved.includes(name.toLowerCase())) return err('Dieser Name ist für den Blog-Owner reserviert. Bitte wähle einen anderen.');
        ls.set(K.lastViewer, name);
        ss.set(K.session, { role: 'viewer', name });
        toast(`Willkommen, ${name}!`, 'success');
        go('#/');
      };
      input.oninput = () => { $('#viewer-error').textContent = ''; input.closest('.field').classList.remove('invalid'); };
    }

    if (step === 'owner') {
      const u = $('#ow-user'), p = $('#ow-pass'), t = $('#pw-toggle');
      setTimeout(() => u.focus(), 60);
      t.onclick = () => {
        const show = p.type === 'password';
        p.type = show ? 'text' : 'password';
        t.innerHTML = show ? I.eyeOff : I.eye;
        t.setAttribute('aria-label', show ? 'Passwort verbergen' : 'Passwort anzeigen');
        t.title = t.getAttribute('aria-label');
        p.focus();
      };
      [u, p].forEach((f) => (f.oninput = () => { $('#ow-error').textContent = ''; $$('.field', card).forEach((x) => x.classList.remove('invalid')); }));
      $('#owner-form').onsubmit = ownerLogin;
    }
  }

  function shake() {
    const c = $('#gate-card');
    if (!c) return;
    c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
  }

  async function ownerLogin(e) {
    e.preventDefault();
    const u = $('#ow-user'), p = $('#ow-pass'), btn = $('#ow-submit');
    const showErr = (msg, fields = []) => {
      $('#ow-error').innerHTML = `${I.alert}<span>${esc(msg)}</span>`;
      [u, p].forEach((f) => f.closest('.field').classList.toggle('invalid', fields.includes(f)));
      shake();
    };
    const lock = ls.get(K.lock, { fails: 0, until: 0 }) || { fails: 0, until: 0 };
    if (lock.until > Date.now()) {
      const sec = Math.ceil((lock.until - Date.now()) / 1000);
      return showErr(`Zu viele Fehlversuche. Bitte warte noch ${sec} Sekunden und versuche es dann erneut.`);
    }
    const user = u.value.trim(), pass = p.value;
    if (!user && !pass) { u.focus(); return showErr('Bitte gib deinen Benutzernamen und dein Passwort ein.', [u, p]); }
    if (!user) { u.focus(); return showErr('Bitte gib deinen Benutzernamen ein.', [u]); }
    if (!pass) { p.focus(); return showErr('Bitte gib dein Passwort ein.', [p]); }
    if (!window.crypto || !crypto.subtle) return showErr('Die Anmeldung benötigt eine sichere Verbindung (HTTPS). Öffne den Blog über GitHub Pages oder einen lokalen Server.');
    if (!CFG.OWNER_PASSWORD_SHA256) return showErr('Es ist kein Owner-Passwort eingerichtet. Bitte trage es in js/config.js ein.');

    btn.disabled = true; btn.classList.add('loading');
    const [hash] = await Promise.all([sha256(CFG.PASSWORD_SALT + ':' + pass), new Promise((r) => setTimeout(r, 450))]);
    btn.disabled = false; btn.classList.remove('loading');

    const ok = user.toLowerCase() === String(CFG.OWNER_USERNAME).toLowerCase() && hash === String(CFG.OWNER_PASSWORD_SHA256).toLowerCase();
    if (!ok) {
      lock.fails = (lock.fails || 0) + 1;
      p.value = '';
      if (lock.fails >= CFG.MAX_LOGIN_ATTEMPTS) {
        ls.set(K.lock, { fails: 0, until: Date.now() + CFG.LOCK_SECONDS * 1000 });
        return showErr(`Zu viele Fehlversuche. Die Anmeldung ist für ${CFG.LOCK_SECONDS} Sekunden gesperrt.`, [u, p]);
      }
      ls.set(K.lock, lock);
      const left = CFG.MAX_LOGIN_ATTEMPTS - lock.fails;
      p.focus();
      return showErr(`Benutzername oder Passwort ist falsch. Noch ${left} ${left === 1 ? 'Versuch' : 'Versuche'}.`, [u, p]);
    }
    ls.del(K.lock);
    const name = data.settings.author || CFG.OWNER_DISPLAY_NAME;
    ss.set(K.session, { role: 'owner', name, expires: Date.now() + CFG.OWNER_SESSION_MINUTES * 60000 });
    toast(`Willkommen zurück, ${name}!`, 'success');
    go('#/dashboard');
  }

  async function logout() {
    if (editorDirty) {
      const ok = await confirmDialog({ title: 'Ungespeicherte Änderungen', text: 'Wenn du dich jetzt abmeldest, gehen deine ungespeicherten Änderungen verloren.', confirm: 'Trotzdem abmelden', danger: true });
      if (!ok) return;
    }
    const wasOwner = isOwner();
    editorDirty = false;
    ss.del(K.session);
    history.replaceState(null, '', location.pathname + location.search);
    lastHash = '';
    renderGate();
    toast(wasOwner ? 'Du hast dich sicher abgemeldet.' : 'Bis bald! Du wurdest abgemeldet.', 'success');
  }

  /* ---------- Grundgerüst ---------- */
  function header(active) {
    const s = getSession();
    const owner = s.role === 'owner';
    const nav = (href, key, label) => `<a class="nav-link ${active === key ? 'active' : ''}" href="${href}" ${active === key ? 'aria-current="page"' : ''}>${label}</a>`;
    return `
      <header class="topbar" id="topbar"><div class="container topbar-inner">
        <a class="brand" href="#/"><span class="brand-mark">${esc(initial(data.settings.title))}</span><span class="brand-text">${esc(data.settings.title)}</span></a>
        <nav class="nav" id="nav" aria-label="Hauptnavigation">
          ${nav('#/', 'blog', 'Blog')}
          ${owner ? nav('#/dashboard', 'dashboard', 'Dashboard') + nav('#/editor/neu', 'editor', 'Neuer Beitrag') : ''}
        </nav>
        <div class="top-actions">
          ${themeBtn()}
          <div class="user-chip" title="Angemeldet als ${esc(s.name)}">${avatar(s.name)}<span class="uc-text"><b>${esc(s.name)}</b><small>${owner ? 'Owner' : 'Viewer'}</small></span></div>
          <button class="btn btn-ghost icon-btn" id="logout-btn" aria-label="Abmelden" title="Abmelden">${I.logout}</button>
          <button class="btn btn-ghost icon-btn menu-btn" id="menu-btn" aria-label="Menü öffnen" aria-expanded="false" aria-controls="nav">${I.menu}</button>
        </div>
      </div></header>`;
  }

  function mount(html, active, title) {
    $('#root').innerHTML = `${header(active)}<main id="app" class="view">${html}</main>
      <footer class="footer"><div class="container footer-inner"><span>© ${new Date().getFullYear()} ${esc(data.settings.title)}</span><span>Gehostet auf GitHub Pages</span></div></footer>`;
    document.title = title ? `${title} · ${data.settings.title}` : data.settings.title;
    $('#logout-btn').onclick = logout;
    const tb = $('#topbar'), mb = $('#menu-btn');
    mb.onclick = () => { const o = tb.classList.toggle('nav-open'); mb.setAttribute('aria-expanded', String(o)); mb.innerHTML = o ? I.x : I.menu; };
    $$('#nav a').forEach((a) => a.addEventListener('click', () => { tb.classList.remove('nav-open'); mb.innerHTML = I.menu; }));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ---------- Blog-Übersicht ---------- */
  const blogFilter = { q: '', cat: '', tag: '' };

  function postCard(p, i, featured) {
    const cc = commentCount(p.id);
    return `
      <article class="card ${featured ? 'featured' : ''}" style="--d:${Math.min(i, 8)}">
        <a class="card-link" href="#/beitrag/${encodeURIComponent(p.id)}">
          <div class="card-media">${coverHtml(p)}</div>
          <div class="card-body">
            <div class="meta">${p.category ? `<span class="badge badge-cat">${esc(p.category)}</span>` : ''}<span>${fmtDate(p.publishedAt)}</span><span>· ${readMin(p.content)} Min. Lesezeit</span></div>
            <h3>${esc(p.title)}</h3>
            ${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}
            <div class="card-foot">
              <span class="who">${avatar(p.author)}${esc(p.author)}</span>
              <span class="cc" aria-label="${cc} Kommentare">${I.comment}${cc}</span>
            </div>
          </div>
        </a>
      </article>`;
  }

  function viewBlog() {
    const s = getSession();
    const posts = sortPosts(data.posts.filter(isLive));
    const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
    if (blogFilter.cat && !cats.includes(blogFilter.cat)) blogFilter.cat = '';

    mount(`
      <section class="blog-hero container">
        <span class="eyebrow">Hallo, ${esc(s.name)}</span>
        <h1>${esc(data.settings.title)}</h1>
        <p>${esc(data.settings.tagline)}</p>
      </section>
      <section class="container">
        ${posts.length ? `
        <div class="filters">
          <div class="chips" id="cat-chips" role="group" aria-label="Nach Kategorie filtern">
            <button class="chip ${!blogFilter.cat ? 'active' : ''}" data-cat="">Alle <span class="count">${posts.length}</span></button>
            ${cats.map((c) => `<button class="chip ${blogFilter.cat === c ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)} <span class="count">${posts.filter((p) => p.category === c).length}</span></button>`).join('')}
          </div>
          <label class="search">${I.search}<input class="input" type="search" id="blog-search" placeholder="Beiträge durchsuchen …" value="${esc(blogFilter.q)}" aria-label="Beiträge durchsuchen"></label>
        </div>
        <div id="tag-filter"></div>` : ''}
        <div id="post-list"></div>
      </section>`, 'blog');

    const renderList = () => {
      const q = blogFilter.q.trim().toLowerCase();
      const list = posts.filter((p) =>
        (!blogFilter.cat || p.category === blogFilter.cat) &&
        (!blogFilter.tag || p.tags.some((t) => t.toLowerCase() === blogFilter.tag.toLowerCase())) &&
        (!q || [p.title, p.excerpt, p.content, p.category, p.tags.join(' '), p.author].join(' ').toLowerCase().includes(q)));
      const tf = $('#tag-filter');
      if (tf) {
        tf.innerHTML = blogFilter.tag ? `<div class="tag-filter">Beiträge mit dem Tag <b>#${esc(blogFilter.tag)}</b> <button class="chip" id="clear-tag">${I.x} Filter entfernen</button></div>` : '';
        const ct = $('#clear-tag'); if (ct) ct.onclick = () => { blogFilter.tag = ''; renderList(); };
      }
      const box = $('#post-list');
      if (!posts.length) {
        box.innerHTML = `<div class="empty"><h3>Hier ist es noch ruhig</h3><p>${isOwner() ? 'Es gibt noch keine veröffentlichten Beiträge.' : 'Bald erscheinen hier die ersten Beiträge. Schau später wieder vorbei!'}</p>${isOwner() ? `<a class="btn btn-primary" href="#/editor/neu">${I.plus} Ersten Beitrag schreiben</a>` : ''}</div>`;
        return;
      }
      if (!list.length) {
        box.innerHTML = `<div class="empty"><h3>Keine Beiträge gefunden</h3><p>Versuch es mit einem anderen Suchbegriff oder einer anderen Kategorie.</p></div>`;
        return;
      }
      const featured = !q && !blogFilter.cat && !blogFilter.tag;
      box.innerHTML = `<div class="grid">${list.map((p, i) => postCard(p, i, featured && i === 0)).join('')}</div>`;
    };

    $$('#cat-chips .chip').forEach((b) => (b.onclick = () => {
      blogFilter.cat = b.dataset.cat;
      $$('#cat-chips .chip').forEach((x) => x.classList.toggle('active', x === b));
      renderList();
    }));
    const search = $('#blog-search');
    if (search) search.oninput = debounce(() => { blogFilter.q = search.value; renderList(); }, 120);
    renderList();
  }

  /* ---------- Einzelner Beitrag ---------- */
  function postArticle(p, { preview = false } = {}) {
    const cover = safeUrl(p.cover);
    return `
      <article class="post container">
        ${preview ? '' : `<a class="back-link" href="#/">${I.back} Alle Beiträge</a>`}
        <header class="post-head">
          ${p.category ? `<span class="badge badge-cat">${esc(p.category)}</span>` : ''}
          <h1>${esc(p.title || 'Ohne Titel')}</h1>
          ${p.excerpt ? `<p class="post-lead">${esc(p.excerpt)}</p>` : ''}
          <div class="byline">
            ${avatar(p.author || '?', 'lg')}<span>von <b>${esc(p.author || '–')}</b></span>
            <span class="dot-sep"></span><span>${fmtDate(p.publishedAt || today())}</span>
            <span class="dot-sep"></span><span>${readMin(p.content)} Min. Lesezeit</span>
          </div>
        </header>
        ${cover ? `<figure class="post-cover"><img src="${esc(cover)}" alt=""></figure>` : '<div class="post-rule"></div>'}
        <div class="prose">${md(p.content) || '<p class="muted">Dieser Beitrag hat noch keinen Inhalt.</p>'}</div>
        ${p.tags.length ? `<div class="post-tags">${p.tags.map((t) => preview ? `<span class="chip">#${esc(t)}</span>` : `<a class="chip" href="#/" data-tag="${esc(t)}">#${esc(t)}</a>`).join('')}</div>` : ''}
      </article>`;
  }

  function commentHtml(c, owner) {
    return `
      <div class="comment" id="c-${esc(c.id)}">
        ${avatar(c.name, 'lg')}
        <div>
          <div class="comment-head">
            <b>${esc(c.name)}</b>${c.role === 'owner' ? '<span class="badge badge-cat">Owner</span>' : ''}
            <time datetime="${esc(c.createdAt)}">${fmtDateTime(c.createdAt)}</time>
            ${owner ? `<button class="btn btn-ghost btn-danger icon-btn btn-sm" data-del-comment="${esc(c.id)}" aria-label="Kommentar löschen" title="Kommentar löschen">${I.trash}</button>` : ''}
          </div>
          <p>${esc(c.text).replace(/\n/g, '<br>')}</p>
        </div>
      </div>`;
  }

  function viewPost(id) {
    const s = getSession();
    const owner = s.role === 'owner';
    const p = data.posts.find((x) => x.id === id);
    if (!p || (!owner && !isLive(p))) return viewNotFound('Dieser Beitrag existiert nicht oder ist noch nicht veröffentlicht.');

    const comments = () => data.comments.filter((c) => c.postId === p.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const st = statusOf(p);

    mount(`
      ${owner ? `
        <div class="container">
          <div class="owner-bar">
            ${statusBadge(p)}
            <span class="muted grow">${st === 'draft' ? 'Entwurf – nur für dich sichtbar' : st === 'scheduled' ? `Erscheint am ${fmtDate(p.publishedAt)}` : 'Für alle Leser sichtbar'} · zuletzt bearbeitet ${fmtDateTime(p.updatedAt)}</span>
            <a class="btn btn-sm" href="#/editor/${encodeURIComponent(p.id)}">${I.edit} Bearbeiten</a>
            <button class="btn btn-sm btn-danger" id="del-post">${I.trash} Löschen</button>
          </div>
        </div>` : ''}
      ${postArticle(p)}
      <section class="comments container" id="comments">
        <h2>Kommentare <span class="count" id="c-count">${comments().length}</span></h2>
        <form class="comment-form" id="comment-form" novalidate>
          <div class="comment-as">${avatar(s.name)}<span>Kommentieren als <b>${esc(s.name)}</b></span></div>
          <textarea id="comment-text" maxlength="1000" placeholder="Was denkst du über diesen Beitrag?" aria-label="Dein Kommentar"></textarea>
          <div class="comment-actions">
            <span class="muted" id="c-chars">0 / 1000</span>
            <p class="form-error" id="comment-error" role="alert"></p>
            <button class="btn btn-primary btn-sm" type="submit">${I.send} Kommentar senden</button>
          </div>
        </form>
        <div id="comment-list"></div>
      </section>`, 'blog', p.title);

    const renderComments = () => {
      const list = comments();
      $('#c-count').textContent = list.length;
      $('#comment-list').innerHTML = list.length ? list.map((c) => commentHtml(c, owner)).join('') : '<p class="no-comments">Noch keine Kommentare. Schreib den ersten!</p>';
    };
    renderComments();

    const ta = $('#comment-text');
    ta.oninput = () => { $('#c-chars').textContent = `${ta.value.length} / 1000`; $('#comment-error').textContent = ''; };
    ta.onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#comment-form').requestSubmit(); };
    $('#comment-form').onsubmit = (e) => {
      e.preventDefault();
      const text = ta.value.trim();
      if (!text) { $('#comment-error').textContent = 'Bitte schreibe zuerst einen Kommentar.'; ta.focus(); return; }
      const c = { id: uid(), postId: p.id, name: s.name, role: s.role, text, createdAt: nowIso() };
      data.comments.push(c);
      if (!persist(owner)) { data.comments.pop(); return; }
      ta.value = ''; ta.oninput();
      renderComments();
      const el = $(`#c-${CSS.escape(c.id)}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(owner ? 'Kommentar veröffentlicht.' : 'Danke für deinen Kommentar!', 'success');
    };

    $('#comment-list').onclick = async (e) => {
      const b = e.target.closest('[data-del-comment]');
      if (!b || !owner) return;
      if (!(await deleteComment(b.dataset.delComment))) return;
      const el = b.closest('.comment');
      el.style.maxHeight = el.offsetHeight + 'px';
      el.classList.add('removing');
      setTimeout(renderComments, 340);
    };

    $$('[data-tag]').forEach((a) => (a.onclick = (e) => {
      e.preventDefault();
      Object.assign(blogFilter, { tag: a.dataset.tag, cat: '', q: '' });
      go('#/');
    }));

    const del = $('#del-post');
    if (del) del.onclick = async () => { if (await deletePost(p.id)) go('#/dashboard'); };
  }

  /* ---------- Gemeinsame Owner-Aktionen ---------- */
  async function deletePost(id) {
    const p = data.posts.find((x) => x.id === id);
    if (!p) return false;
    const n = commentCount(id);
    const ok = await confirmDialog({
      title: 'Beitrag löschen?',
      text: `„${p.title || 'Ohne Titel'}“ wird dauerhaft gelöscht${n ? ` – zusammen mit ${n} ${n === 1 ? 'Kommentar' : 'Kommentaren'}` : ''}. Das kann nicht rückgängig gemacht werden.`,
      confirm: 'Endgültig löschen',
      danger: true
    });
    if (!ok) return false;
    data.posts = data.posts.filter((x) => x.id !== id);
    data.comments = data.comments.filter((c) => c.postId !== id);
    persist(true);
    toast('Beitrag gelöscht.', 'success');
    return true;
  }

  async function deleteComment(id) {
    const c = data.comments.find((x) => x.id === id);
    if (!c) return false;
    const ok = await confirmDialog({ title: 'Kommentar löschen?', text: `Der Kommentar von ${c.name} wird dauerhaft entfernt.`, confirm: 'Löschen', danger: true });
    if (!ok) return false;
    data.comments = data.comments.filter((x) => x.id !== id);
    persist(true);
    toast('Kommentar gelöscht.', 'success');
    return true;
  }

  function validateForPublish(p) {
    if (!p.title.trim()) return 'Bitte gib dem Beitrag einen Titel, bevor du ihn veröffentlichst.';
    if (!p.content.trim()) return 'Der Beitrag hat noch keinen Inhalt. Schreib zuerst etwas, bevor du ihn veröffentlichst.';
    return '';
  }

  function previewModal(p, { foot, onPublish } = {}) {
    const m = openModal({
      title: 'Vorschau',
      titleHtml: `<span class="preview-flag">${I.eye} So sehen Leser den Beitrag</span>`,
      wide: true,
      body: postArticle(p, { preview: true }),
      foot: foot || '<button class="btn" data-close>Schließen</button>'
    });
    const pub = $('[data-publish]', m.el);
    if (pub && onPublish) pub.onclick = () => { m.close(true); onPublish(); };
    const ed = $('[data-edit]', m.el);
    if (ed) ed.onclick = () => { m.close(true); go(`#/editor/${encodeURIComponent(p.id)}`); };
    return m;
  }

  /* ---------- Dashboard ---------- */
  const dashFilter = { status: 'all', q: '', cq: '' };

  function viewDashboard(tab) {
    const posts = data.posts;
    const count = (st) => posts.filter((p) => statusOf(p) === st).length;
    const tabs = [['beitraege', 'Beiträge'], ['kommentare', `Kommentare (${data.comments.length})`], ['einstellungen', 'Einstellungen & Daten']];
    if (!tabs.some(([k]) => k === tab)) tab = 'beitraege';

    mount(`
      <section class="container">
        <div class="page-head">
          <div>
            <span class="eyebrow">Administration</span>
            <h1>Dashboard</h1>
            <p class="muted">Verwalte Beiträge, Kommentare und Einstellungen deines Blogs.</p>
          </div>
          <a class="btn btn-primary" href="#/editor/neu">${I.plus} Neuer Beitrag</a>
        </div>
        <div class="stats">
          <div class="stat" style="--d:0"><b>${posts.length}</b><span>Beiträge gesamt</span></div>
          <div class="stat" style="--d:1;--c:var(--ok-soft)"><b>${count('published')}</b><span>Veröffentlicht</span></div>
          <div class="stat" style="--d:2;--c:var(--warn-soft)"><b>${count('draft') + count('scheduled')}</b><span>Entwürfe & geplant</span></div>
          <div class="stat" style="--d:3;--c:var(--info-soft)"><b>${data.comments.length}</b><span>Kommentare</span></div>
        </div>
        ${hasUnexported() ? `
          <div class="notice info dash-notice">${I.globe}
            <div><b>Änderungen noch nicht für alle sichtbar.</b><br><span class="muted">Deine Änderungen sind in diesem Browser gespeichert. Damit alle Besucher sie sehen, lade die Datendatei herunter und ersetze damit <code>data/blog-data.js</code> in deinem GitHub-Repository.</span></div>
            <button class="btn btn-primary btn-sm" id="quick-export">${I.download} Jetzt exportieren</button>
          </div>` : ''}
        <nav class="tabs" aria-label="Dashboard-Bereiche">
          ${tabs.map(([k, l]) => `<a class="tab ${tab === k ? 'active' : ''}" href="#/dashboard${k === 'beitraege' ? '' : '/' + k}" ${tab === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}
        </nav>
        <div class="dash-body" id="dash-body"></div>
      </section>`, 'dashboard', 'Dashboard');

    const qe = $('#quick-export');
    if (qe) qe.onclick = () => { exportData(); route(); };

    if (tab === 'beitraege') dashPosts();
    else if (tab === 'kommentare') dashComments();
    else dashSettings();
  }

  function dashPosts() {
    const body = $('#dash-body');
    const counts = { all: data.posts.length, published: 0, draft: 0, scheduled: 0 };
    data.posts.forEach((p) => counts[statusOf(p)]++);
    const seg = [['all', 'Alle'], ['published', 'Veröffentlicht'], ['draft', 'Entwürfe'], ['scheduled', 'Geplant']];

    body.innerHTML = `
      <div class="panel">
        <div class="list-tools">
          <div class="chips" id="status-chips" role="group" aria-label="Nach Status filtern">
            ${seg.map(([k, l]) => `<button class="chip ${dashFilter.status === k ? 'active' : ''}" data-status="${k}">${l} <span class="count">${counts[k]}</span></button>`).join('')}
          </div>
          <label class="search">${I.search}<input class="input" type="search" id="dash-search" placeholder="Beiträge suchen …" value="${esc(dashFilter.q)}" aria-label="Beiträge suchen"></label>
        </div>
        <div id="rows"></div>
      </div>`;

    const renderRows = () => {
      const q = dashFilter.q.trim().toLowerCase();
      const list = [...data.posts]
        .filter((p) => dashFilter.status === 'all' || statusOf(p) === dashFilter.status)
        .filter((p) => !q || [p.title, p.category, p.tags.join(' '), p.author].join(' ').toLowerCase().includes(q))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const rows = $('#rows');
      if (!data.posts.length) {
        rows.innerHTML = `<div class="list-empty"><p>Du hast noch keine Beiträge geschrieben.</p><a class="btn btn-primary" style="margin-top:14px" href="#/editor/neu">${I.plus} Ersten Beitrag erstellen</a></div>`;
        return;
      }
      if (!list.length) { rows.innerHTML = '<div class="list-empty">Keine passenden Beiträge gefunden.</div>'; return; }
      rows.innerHTML = list.map((p, i) => {
        const st = statusOf(p);
        const cc = commentCount(p.id);
        return `
          <div class="row" style="--d:${Math.min(i, 10)}">
            <div class="row-thumb">${coverHtml(p)}</div>
            <div style="min-width:0">
              <a class="row-title" href="#/beitrag/${encodeURIComponent(p.id)}">${esc(p.title || 'Ohne Titel')}</a>
              <div class="row-meta">
                ${statusBadge(p)}
                ${p.category ? `<span>${esc(p.category)}</span>` : ''}
                <span>${st === 'draft' ? `Bearbeitet ${fmtDateTime(p.updatedAt)}` : fmtDate(p.publishedAt)}</span>
                <span>von ${esc(p.author)}</span>
                <span>${cc} ${cc === 1 ? 'Kommentar' : 'Kommentare'}</span>
                ${p.tags.length ? `<span>${p.tags.map((t) => '#' + esc(t)).join(' ')}</span>` : ''}
              </div>
            </div>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" data-act="preview" data-id="${esc(p.id)}">${I.eye} Vorschau</button>
              <a class="btn btn-ghost btn-sm" href="#/editor/${encodeURIComponent(p.id)}">${I.edit} Bearbeiten</a>
              ${st === 'draft'
                ? `<button class="btn btn-ghost btn-sm" data-act="publish" data-id="${esc(p.id)}">${I.globe} Veröffentlichen</button>`
                : `<button class="btn btn-ghost btn-sm" data-act="unpublish" data-id="${esc(p.id)}">${I.undo} Zurückziehen</button>`}
              <button class="btn btn-ghost btn-sm btn-danger icon-btn" data-act="delete" data-id="${esc(p.id)}" aria-label="Löschen" title="Löschen">${I.trash}</button>
            </div>
          </div>`;
      }).join('');
    };

    $$('#status-chips .chip').forEach((b) => (b.onclick = () => {
      dashFilter.status = b.dataset.status;
      $$('#status-chips .chip').forEach((x) => x.classList.toggle('active', x === b));
      renderRows();
    }));
    $('#dash-search').oninput = debounce((e) => { dashFilter.q = e.target.value; renderRows(); }, 120);

    $('#rows').onclick = async (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const p = data.posts.find((x) => x.id === b.dataset.id);
      if (!p) return;
      const act = b.dataset.act;
      if (act === 'preview') {
        previewModal(p, {
          foot: `<button class="btn" data-close>Schließen</button><button class="btn" data-edit>${I.edit} Bearbeiten</button>${statusOf(p) === 'draft' ? `<button class="btn btn-primary" data-publish>${I.globe} Veröffentlichen</button>` : ''}`,
          onPublish: () => publishPost(p)
        });
      } else if (act === 'publish') {
        publishPost(p);
      } else if (act === 'unpublish') {
        const ok = await confirmDialog({ title: 'Beitrag zurückziehen?', text: `„${p.title}“ wird wieder zum Entwurf und ist für Leser nicht mehr sichtbar.`, confirm: 'Zurückziehen' });
        if (!ok) return;
        p.status = 'draft'; p.updatedAt = nowIso();
        persist(true); toast('Beitrag ist jetzt wieder ein Entwurf.', 'success'); route();
      } else if (act === 'delete') {
        if (await deletePost(p.id)) route();
      }
    };
    renderRows();
  }

  function publishPost(p) {
    const err = validateForPublish(p);
    if (err) { toast(err, 'error'); go(`#/editor/${encodeURIComponent(p.id)}`); return; }
    p.status = 'published';
    if (!p.publishedAt) p.publishedAt = today();
    p.updatedAt = nowIso();
    persist(true);
    toast(isLive(p) ? 'Beitrag veröffentlicht!' : `Beitrag geplant für den ${fmtDate(p.publishedAt)}.`, 'success');
    route();
  }

  function dashComments() {
    const body = $('#dash-body');
    body.innerHTML = `
      <div class="panel">
        <div class="list-tools">
          <span class="muted small">Alle Kommentare, neueste zuerst</span>
          <label class="search">${I.search}<input class="input" type="search" id="c-search" placeholder="Kommentare suchen …" value="${esc(dashFilter.cq)}" aria-label="Kommentare suchen"></label>
        </div>
        <div id="c-rows"></div>
      </div>`;
    const render = () => {
      const q = dashFilter.cq.trim().toLowerCase();
      const list = [...data.comments]
        .filter((c) => !q || (c.name + ' ' + c.text).toLowerCase().includes(q))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const rows = $('#c-rows');
      if (!data.comments.length) { rows.innerHTML = '<div class="list-empty">Noch keine Kommentare vorhanden.</div>'; return; }
      if (!list.length) { rows.innerHTML = '<div class="list-empty">Keine passenden Kommentare gefunden.</div>'; return; }
      rows.innerHTML = list.map((c, i) => {
        const p = data.posts.find((x) => x.id === c.postId);
        return `
          <div class="row cmt-row" style="--d:${Math.min(i, 10)}">
            ${avatar(c.name, 'lg')}
            <div style="min-width:0">
              <div class="row-meta" style="margin-top:0">
                <b style="color:var(--text)">${esc(c.name)}</b>${c.role === 'owner' ? '<span class="badge badge-cat">Owner</span>' : ''}
                <span>${fmtDateTime(c.createdAt)}</span>
                <span>zu ${p ? `<a href="#/beitrag/${encodeURIComponent(p.id)}#comments">${esc(p.title)}</a>` : '<i>gelöschtem Beitrag</i>'}</span>
              </div>
              <p>${esc(c.text).replace(/\n/g, '<br>')}</p>
            </div>
            <button class="btn btn-ghost btn-sm btn-danger" data-del-comment="${esc(c.id)}">${I.trash} Löschen</button>
          </div>`;
      }).join('');
    };
    $('#c-search').oninput = debounce((e) => { dashFilter.cq = e.target.value; render(); }, 120);
    $('#c-rows').onclick = async (e) => {
      const b = e.target.closest('[data-del-comment]');
      if (b && (await deleteComment(b.dataset.delComment))) route();
    };
    render();
  }

  function dashSettings() {
    const st = data.settings;
    $('#dash-body').innerHTML = `
      <div class="settings-grid">
        <section class="panel pad">
          <h3 class="side-title">Blog</h3>
          <form id="settings-form" novalidate>
            <label class="field"><span>Blog-Titel</span><input class="input" name="title" maxlength="60" value="${esc(st.title)}" required></label>
            <label class="field"><span>Untertitel</span><textarea class="input" name="tagline" rows="2" maxlength="200">${esc(st.tagline)}</textarea></label>
            <label class="field"><span>Standard-Autor für neue Beiträge</span><input class="input" name="author" maxlength="40" value="${esc(st.author)}"></label>
            <p class="form-error" id="settings-error" role="alert"></p>
            <button class="btn btn-primary" type="submit">Speichern</button>
          </form>
        </section>

        <section class="panel pad">
          <h3 class="side-title">Für alle veröffentlichen</h3>
          <p class="muted small">Der Blog speichert deine Änderungen zuerst in diesem Browser. So werden sie für alle Besucher sichtbar:</p>
          <ol class="steps">
            <li>Datei <code>blog-data.js</code> herunterladen.</li>
            <li>In deinem GitHub-Repository die Datei <code>data/blog-data.js</code> damit ersetzen (<i>Add file → Upload files</i>).</li>
            <li>„Commit changes“ klicken – nach etwa einer Minute ist alles online.</li>
          </ol>
          <div class="btn-row">
            <button class="btn btn-primary" id="export-btn">${I.download} blog-data.js herunterladen</button>
            <label class="btn" tabindex="0">${I.upload} Importieren<input type="file" id="import-file" accept=".js,.json,application/json,text/javascript" hidden></label>
          </div>
          <p class="muted small" style="margin-top:16px">Lokaler Stand: ${data.posts.length} Beiträge, ${data.comments.length} Kommentare · ${hasUnexported() ? '<b style="color:var(--warn)">nicht exportiert</b>' : '<b style="color:var(--ok)">mit Repository synchron</b>'}</p>
          <button class="btn btn-ghost btn-danger btn-sm" id="reset-btn" style="margin-top:10px;margin-left:-12px">${I.undo} Lokale Änderungen verwerfen</button>
        </section>

        <section class="panel pad">
          <h3 class="side-title">Passwort ändern</h3>
          <p class="muted small" style="margin-bottom:16px">Das Passwort steht nie im Klartext im Code – nur als Prüfsumme (Hash) in <code>js/config.js</code>. Erzeuge hier den Hash für ein neues Passwort.</p>
          <form id="pw-form" novalidate>
            <label class="field"><span>Neues Passwort</span>
              <span class="pw-wrap"><input class="input" id="pw-new" type="password" autocomplete="new-password" minlength="10">
              <button type="button" class="pw-toggle" data-pw-toggle="pw-new" aria-label="Passwort anzeigen">${I.eye}</button></span></label>
            <label class="field"><span>Passwort wiederholen</span>
              <input class="input" id="pw-repeat" type="password" autocomplete="new-password"></label>
            <p class="form-error" id="pw-error" role="alert"></p>
            <button class="btn btn-primary" type="submit">Hash erzeugen</button>
          </form>
          <div id="hash-out"></div>
        </section>
      </div>`;

    $('#settings-form').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const title = f.title.value.trim();
      if (!title) { $('#settings-error').textContent = 'Der Blog braucht einen Titel.'; f.title.focus(); return; }
      data.settings = { title, tagline: f.tagline.value.trim(), author: f.author.value.trim() || CFG.OWNER_DISPLAY_NAME };
      const s = getSession(); s.name = data.settings.author; ss.set(K.session, s);
      persist(true);
      toast('Einstellungen gespeichert.', 'success');
      route();
    };

    $('#export-btn').onclick = () => { exportData(); route(); };
    $('#import-file').onchange = (e) => { const file = e.target.files[0]; e.target.value = ''; if (file) importFile(file); };
    $('label[tabindex="0"]').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#import-file').click(); } };

    $('#reset-btn').onclick = async () => {
      const ok = await confirmDialog({
        title: 'Lokale Änderungen verwerfen?',
        text: 'Der Blog wird auf den Stand aus dem GitHub-Repository zurückgesetzt. Alle nicht exportierten Änderungen in diesem Browser gehen verloren.',
        confirm: 'Zurücksetzen',
        danger: true
      });
      if (!ok) return;
      ls.del(K.data);
      data = loadData();
      toast('Auf den Stand des Repositorys zurückgesetzt.', 'success');
      route();
    };

    $$('[data-pw-toggle]').forEach((t) => (t.onclick = () => {
      const inp = $('#' + t.dataset.pwToggle), rep = $('#pw-repeat');
      const show = inp.type === 'password';
      inp.type = rep.type = show ? 'text' : 'password';
      t.innerHTML = show ? I.eyeOff : I.eye;
      t.setAttribute('aria-label', show ? 'Passwort verbergen' : 'Passwort anzeigen');
    }));

    $('#pw-form').onsubmit = async (e) => {
      e.preventDefault();
      const a = $('#pw-new').value, b = $('#pw-repeat').value, err = $('#pw-error');
      err.textContent = '';
      if (a.length < 10) { err.textContent = 'Das Passwort muss mindestens 10 Zeichen lang sein.'; return; }
      if (!/[a-zA-ZäöüÄÖÜß]/.test(a) || !/[\d\W_]/.test(a)) { err.textContent = 'Verwende Buchstaben und mindestens eine Zahl oder ein Sonderzeichen.'; return; }
      if (a !== b) { err.textContent = 'Die beiden Passwörter stimmen nicht überein.'; return; }
      if (!window.crypto || !crypto.subtle) { err.textContent = 'Hash kann nur über eine sichere Verbindung (HTTPS) erzeugt werden.'; return; }
      const hash = await sha256(CFG.PASSWORD_SALT + ':' + a);
      const line = `OWNER_PASSWORD_SHA256: '${hash}',`;
      $('#hash-out').innerHTML = `<div class="hash-out">Ersetze in <b>js/config.js</b> die Zeile mit:<br><br>${esc(line)}<br><button class="btn btn-sm" id="copy-hash">${I.copy} Kopieren</button></div>`;
      $('#copy-hash').onclick = async () => {
        try { await navigator.clipboard.writeText(line); toast('In die Zwischenablage kopiert.', 'success'); }
        catch { toast('Kopieren nicht möglich – bitte markieren und manuell kopieren.', 'error'); }
      };
      $('#pw-new').value = $('#pw-repeat').value = '';
    };
  }

  function exportData() {
    const out = Object.assign({}, data, { exportedAt: nowIso() });
    const txt = `/* Blog-Daten – exportiert am ${new Date().toLocaleString('de-DE')}.\n   Ersetze damit die Datei data/blog-data.js in deinem GitHub-Repository. */\nwindow.BLOG_DATA = ${JSON.stringify(out, null, 2)};\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript;charset=utf-8' }));
    a.download = 'blog-data.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    ls.set(K.exported, data.revision);
    toast('Heruntergeladen! Jetzt im Repository data/blog-data.js damit ersetzen.', 'success');
  }

  async function importFile(file) {
    let obj;
    try {
      const txt = await file.text();
      obj = JSON.parse(txt.replace(/^[\s\S]*?window\.BLOG_DATA\s*=\s*/, '').replace(/;\s*$/, ''));
      if (!obj || !Array.isArray(obj.posts)) throw new Error();
    } catch {
      toast('Die Datei konnte nicht gelesen werden. Erwartet wird eine exportierte blog-data.js oder .json-Datei.', 'error');
      return;
    }
    const ok = await confirmDialog({
      title: 'Daten importieren?',
      text: `Die Datei enthält ${obj.posts.length} Beiträge und ${(obj.comments || []).length} Kommentare. Die aktuellen Daten in diesem Browser werden dadurch ersetzt.`,
      confirm: 'Importieren'
    });
    if (!ok) return;
    data = normalize(obj);
    persist(true);
    toast('Daten erfolgreich importiert.', 'success');
    route();
  }

  /* ---------- Editor ---------- */
  function readImage(file, maxW = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\/(png|jpe?g|gif|webp|avif)$/i.test(file.type)) return reject(new Error('Bitte wähle eine Bilddatei (JPG, PNG, WebP oder GIF).'));
      if (file.size > 20 * 1024 * 1024) return reject(new Error('Das Bild ist zu groß (maximal 20 MB).'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Dieses Bildformat wird nicht unterstützt.'));
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width);
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function urlDialog({ title, label, withText = false, textLabel = '', textValue = '', withFile = false }) {
    return new Promise((resolve) => {
      let fileData = '';
      const m = openModal({
        title,
        body: `
          <form id="url-form" novalidate>
            ${withFile ? `
              <label class="btn btn-block" style="margin-bottom:12px" tabindex="0" id="file-label">${I.upload} Bild vom Gerät hochladen<input type="file" id="url-file" accept="image/*" hidden></label>
              <p class="muted small" id="file-name" style="text-align:center;margin:-4px 0 12px">oder eine Bild-Adresse einfügen:</p>` : ''}
            <label class="field"><span>${esc(label)}</span><input class="input" id="url-input" placeholder="https://…" data-autofocus inputmode="url"></label>
            ${withText ? `<label class="field"><span>${esc(textLabel)}</span><input class="input" id="url-text" value="${esc(textValue)}"></label>` : ''}
            <p class="form-error" id="url-error" role="alert"></p>
          </form>`,
        foot: `<button class="btn" data-close>Abbrechen</button><button class="btn btn-primary" data-ok>Einfügen</button>`,
        onClose: (r) => resolve(r || null)
      });
      const err = (msg) => { $('#url-error', m.el).textContent = msg; };
      const submit = () => {
        const raw = $('#url-input', m.el).value.trim();
        const url = fileData || raw;
        if (!url) return err(withFile ? 'Bitte lade ein Bild hoch oder gib eine Bild-Adresse ein.' : 'Bitte gib eine Adresse ein.');
        if (!fileData && !/^https?:\/\/\S+$/i.test(raw) && !/^[\w./-]+\.(jpe?g|png|gif|webp|avif|svg)$/i.test(raw)) return err('Bitte gib eine gültige Adresse ein, die mit https:// beginnt.');
        m.close({ url, text: withText ? $('#url-text', m.el).value.trim() : '' });
      };
      $('[data-ok]', m.el).onclick = submit;
      $('#url-form', m.el).onsubmit = (e) => { e.preventDefault(); submit(); };
      if (withFile) {
        const fl = $('#file-label', m.el);
        fl.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#url-file', m.el).click(); } };
        $('#url-file', m.el).onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            fileData = await readImage(file);
            $('#file-name', m.el).textContent = `✓ ${file.name} bereit`;
            $('#url-input', m.el).value = '';
            err('');
          } catch (ex) { err(ex.message); }
        };
      }
    });
  }

  function viewEditor(id) {
    const existing = id ? data.posts.find((p) => p.id === id) : null;
    if (id && !existing) return viewNotFound('Dieser Beitrag wurde nicht gefunden. Vielleicht wurde er gelöscht.');
    const d = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: uid(), title: '', excerpt: '', content: '', cover: '', category: '', tags: [],
      author: data.settings.author, status: 'draft', publishedAt: today(), createdAt: nowIso(), updatedAt: ''
    };
    const isNew = () => !data.posts.some((p) => p.id === d.id);
    const categories = [...new Set(data.posts.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));

    mount(`
      <section class="container">
        <div class="editor-head">
          <a class="back-link" href="#/dashboard">${I.back} Dashboard</a>
          <h1 id="ed-heading">${existing ? 'Beitrag bearbeiten' : 'Neuer Beitrag'}</h1>
          <span id="ed-status">${statusBadge(d)}</span>
        </div>
        <div class="editor-grid">
          <div class="panel editor-main">
            <textarea class="title-input" id="ed-title" rows="1" maxlength="140" placeholder="Titel des Beitrags" aria-label="Titel">${esc(d.title)}</textarea>
            <textarea class="excerpt-input" id="ed-excerpt" rows="1" maxlength="300" placeholder="Kurze Zusammenfassung – erscheint auf der Übersicht" aria-label="Zusammenfassung">${esc(d.excerpt)}</textarea>
            <div class="toolbar" role="toolbar" aria-label="Formatierung">
              <button class="tb" data-tb="h2" title="Überschrift">H2</button>
              <button class="tb" data-tb="h3" title="Zwischenüberschrift">H3</button>
              <span class="tb-sep"></span>
              <button class="tb" data-tb="bold" title="Fett (Strg+B)"><b>B</b></button>
              <button class="tb" data-tb="italic" title="Kursiv (Strg+I)"><i style="font-family:Georgia,serif">I</i></button>
              <span class="tb-sep"></span>
              <button class="tb" data-tb="ul" title="Aufzählung">• Liste</button>
              <button class="tb" data-tb="ol" title="Nummerierte Liste">1. Liste</button>
              <button class="tb" data-tb="quote" title="Zitat">„ Zitat</button>
              <button class="tb" data-tb="hr" title="Trennlinie">—</button>
              <span class="tb-sep"></span>
              <button class="tb" data-tb="link" title="Link einfügen">${I.link} Link</button>
              <button class="tb" data-tb="image" title="Bild einfügen">${I.image} Bild</button>
            </div>
            <textarea class="content-input" id="ed-content" placeholder="Erzähl deine Geschichte …" aria-label="Inhalt">${esc(d.content)}</textarea>
            <p class="editor-help">Formatierung: <code>## Überschrift</code> · <code>**fett**</code> · <code>*kursiv*</code> · <code>- Liste</code> · <code>&gt; Zitat</code> · <code>[Text](https://…)</code> · <span id="ed-words"></span></p>
          </div>

          <aside class="editor-side">
            <section class="panel pad">
              <h3 class="side-title">Veröffentlichung</h3>
              <label class="field"><span>Veröffentlichungsdatum</span><input class="input" type="date" id="ed-date" value="${esc(d.publishedAt)}"></label>
              <p class="field-hint">Liegt das Datum in der Zukunft, erscheint der Beitrag erst dann.</p>
              <label class="field"><span>Autor</span><input class="input" id="ed-author" maxlength="40" value="${esc(d.author)}"></label>
              <div class="side-actions">
                <div class="two">
                  <button class="btn" id="ed-preview">${I.eye} Vorschau</button>
                  <button class="btn" id="ed-draft">Als Entwurf</button>
                </div>
                <button class="btn btn-primary btn-block" id="ed-publish">${I.globe} <span id="ed-publish-label">${d.status === 'published' ? 'Änderungen veröffentlichen' : 'Veröffentlichen'}</span></button>
              </div>
              <p class="field-hint" id="ed-draft-hint" style="margin:12px 0 0;${d.status === 'published' ? '' : 'display:none'}">„Als Entwurf“ nimmt den Beitrag offline.</p>
            </section>

            <section class="panel pad">
              <h3 class="side-title">Titelbild</h3>
              <button class="cover-drop" id="ed-cover" type="button" aria-label="Titelbild auswählen"></button>
              <input type="file" id="ed-cover-file" accept="image/*" hidden>
              <div class="cover-actions">
                <button class="btn btn-sm" id="ed-cover-url">${I.link} Bild-Adresse</button>
                <button class="btn btn-sm btn-ghost btn-danger" id="ed-cover-remove">${I.trash} Entfernen</button>
              </div>
            </section>

            <section class="panel pad">
              <h3 class="side-title">Kategorie & Tags</h3>
              <label class="field"><span>Kategorie</span><input class="input" id="ed-category" list="cat-list" maxlength="40" value="${esc(d.category)}" placeholder="z. B. Reisen"></label>
              <datalist id="cat-list">${categories.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
              <div class="field" style="margin-bottom:6px"><span class="label">Tags</span>
                <div class="tag-input" id="ed-tags"><input id="ed-tag-input" maxlength="30" placeholder="Tag eingeben + Enter" aria-label="Tag hinzufügen"></div>
              </div>
              <p class="field-hint" style="margin:6px 0 0">Mit Enter oder Komma hinzufügen (max. 10).</p>
            </section>

            ${existing ? `<button class="btn btn-ghost btn-danger" id="ed-delete">${I.trash} Beitrag löschen</button>` : ''}
          </aside>
        </div>
      </section>`, 'editor', existing ? 'Beitrag bearbeiten' : 'Neuer Beitrag');

    const title = $('#ed-title'), excerpt = $('#ed-excerpt'), content = $('#ed-content');
    const markDirty = () => { editorDirty = true; };
    const autosize = (ta) => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    [title, excerpt].forEach((ta) => {
      autosize(ta);
      ta.addEventListener('input', () => { autosize(ta); markDirty(); });
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); (ta === title ? excerpt : content).focus(); } });
    });
    window.addEventListener('resize', () => [title, excerpt].forEach((ta) => document.contains(ta) && autosize(ta)), { once: true });
    const words = () => { const n = content.value.split(/\s+/).filter(Boolean).length; $('#ed-words').textContent = `${n} ${n === 1 ? 'Wort' : 'Wörter'} · ca. ${readMin(content.value)} Min.`; };
    content.addEventListener('input', () => { markDirty(); words(); });
    words();
    ['#ed-date', '#ed-author', '#ed-category'].forEach((s) => $(s).addEventListener('input', markDirty));
    if (!existing) setTimeout(() => title.focus(), 80);

    /* Toolbar */
    const changed = () => content.dispatchEvent(new Event('input'));
    const wrapSel = (before, after, placeholder) => {
      const s = content.selectionStart, e = content.selectionEnd;
      const text = content.value.slice(s, e) || placeholder;
      content.focus();
      content.setRangeText(before + text + after, s, e, 'end');
      content.setSelectionRange(s + before.length, s + before.length + text.length);
      changed();
    };
    const prefixLines = (prefix) => {
      const v = content.value, s = content.selectionStart, e = content.selectionEnd;
      const start = v.lastIndexOf('\n', s - 1) + 1;
      let end = v.indexOf('\n', e); if (end === -1) end = v.length;
      const lines = v.slice(start, end).split('\n');
      const rx = prefix === '1. ' ? /^\d+\.\s/ : new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const all = lines.every((l) => rx.test(l));
      const strip = (l) => l.replace(/^(#{1,3}\s|>\s?|[-*]\s|\d+[.)]\s)/, '');
      const out = lines.map((l, i) => (all ? l.replace(rx, '') : (prefix === '1. ' ? `${i + 1}. ` : prefix) + strip(l))).join('\n');
      content.focus();
      content.setRangeText(out, start, end, 'select');
      changed();
    };
    const insertBlock = (block) => {
      const v = content.value, s = content.selectionStart, e = content.selectionEnd;
      const pre = s === 0 || v.slice(0, s).endsWith('\n\n') ? '' : v.slice(0, s).endsWith('\n') ? '\n' : '\n\n';
      const post = v.slice(e).startsWith('\n\n') ? '' : v.slice(e).startsWith('\n') ? '\n' : '\n\n';
      content.focus();
      content.setRangeText(pre + block + post, s, e, 'end');
      changed();
    };
    const TB = {
      h2: () => prefixLines('## '),
      h3: () => prefixLines('### '),
      bold: () => wrapSel('**', '**', 'fetter Text'),
      italic: () => wrapSel('*', '*', 'kursiver Text'),
      ul: () => prefixLines('- '),
      ol: () => prefixLines('1. '),
      quote: () => prefixLines('> '),
      hr: () => insertBlock('---'),
      link: async () => {
        const s = content.selectionStart, e = content.selectionEnd;
        const r = await urlDialog({ title: 'Link einfügen', label: 'Adresse (URL)', withText: true, textLabel: 'Angezeigter Text', textValue: content.value.slice(s, e) });
        if (!r) return;
        content.focus(); content.setSelectionRange(s, e);
        content.setRangeText(`[${r.text || r.url}](${r.url})`, s, e, 'end');
        changed();
      },
      image: async () => {
        const s = content.selectionStart, e = content.selectionEnd;
        const r = await urlDialog({ title: 'Bild einfügen', label: 'Bild-Adresse', withText: true, textLabel: 'Bildunterschrift (optional)', withFile: true });
        if (!r) return;
        content.focus(); content.setSelectionRange(s, e);
        insertBlock(`![${r.text.replace(/[\[\]]/g, '')}](${r.url})`);
      }
    };
    $$('[data-tb]').forEach((b) => (b.onclick = (e) => { e.preventDefault(); TB[b.dataset.tb](); }));
    content.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'b') { e.preventDefault(); TB.bold(); }
      if (k === 'i') { e.preventDefault(); TB.italic(); }
    });

    /* Titelbild */
    const coverBox = $('#ed-cover'), coverFile = $('#ed-cover-file');
    const renderCover = () => {
      const u = safeUrl(d.cover);
      coverBox.classList.toggle('has', !!u);
      coverBox.innerHTML = u ? `<img src="${esc(u)}" alt="Titelbild">` : `<span>${I.image}<b>Bild hierher ziehen</b><br>oder klicken zum Auswählen</span>`;
      $('#ed-cover-remove').style.display = u ? '' : 'none';
    };
    const setCoverFromFile = async (file) => {
      try { d.cover = await readImage(file); markDirty(); renderCover(); toast('Titelbild hinzugefügt.', 'success'); }
      catch (ex) { toast(ex.message, 'error'); }
    };
    coverBox.onclick = () => coverFile.click();
    coverFile.onchange = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) setCoverFromFile(f); };
    ['dragenter', 'dragover'].forEach((ev) => coverBox.addEventListener(ev, (e) => { e.preventDefault(); coverBox.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((ev) => coverBox.addEventListener(ev, (e) => { e.preventDefault(); coverBox.classList.remove('drag'); }));
    coverBox.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) setCoverFromFile(f); });
    $('#ed-cover-url').onclick = async () => {
      const r = await urlDialog({ title: 'Titelbild per Adresse', label: 'Bild-Adresse' });
      if (r) { d.cover = r.url; markDirty(); renderCover(); }
    };
    $('#ed-cover-remove').onclick = () => { d.cover = ''; markDirty(); renderCover(); };
    renderCover();

    /* Tags */
    const tagBox = $('#ed-tags'), tagInput = $('#ed-tag-input');
    const renderTags = () => {
      $$('.tag-pill', tagBox).forEach((x) => x.remove());
      tagInput.insertAdjacentHTML('beforebegin', d.tags.map((t, i) => `<span class="tag-pill">#${esc(t)}<button type="button" data-rm="${i}" aria-label="Tag ${esc(t)} entfernen">${I.x}</button></span>`).join(''));
      tagInput.placeholder = d.tags.length ? '' : 'Tag eingeben + Enter';
    };
    const addTag = (raw) => {
      const t = raw.replace(/^#+/, '').replace(/[,\s]+/g, ' ').trim();
      if (!t) return;
      if (d.tags.length >= 10) return toast('Maximal 10 Tags pro Beitrag.', 'error');
      if (d.tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
      d.tags.push(t); markDirty(); renderTags();
    };
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput.value); tagInput.value = ''; }
      else if (e.key === 'Backspace' && !tagInput.value && d.tags.length) { d.tags.pop(); markDirty(); renderTags(); }
    });
    tagInput.addEventListener('blur', () => { if (tagInput.value.trim()) { addTag(tagInput.value); tagInput.value = ''; } });
    tagBox.onclick = (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { d.tags.splice(Number(rm.dataset.rm), 1); markDirty(); renderTags(); tagInput.focus(); }
      else if (e.target === tagBox) tagInput.focus();
    };
    renderTags();

    /* Speichern */
    const collect = () => {
      d.title = title.value.trim();
      d.excerpt = excerpt.value.trim();
      d.content = content.value.replace(/\s+$/, '');
      d.publishedAt = $('#ed-date').value;
      d.author = $('#ed-author').value.trim() || data.settings.author;
      d.category = $('#ed-category').value.trim();
      if (tagInput.value.trim()) { addTag(tagInput.value); tagInput.value = ''; }
    };
    const refreshHead = () => {
      $('#ed-status').innerHTML = statusBadge(d);
      $('#ed-heading').textContent = 'Beitrag bearbeiten';
      $('#ed-publish-label').textContent = d.status === 'published' ? 'Änderungen veröffentlichen' : 'Veröffentlichen';
      $('#ed-draft-hint').style.display = d.status === 'published' ? '' : 'none';
    };
    const save = (status) => {
      collect();
      if (!d.title) { toast('Bitte gib dem Beitrag einen Titel.', 'error'); title.focus(); return false; }
      if (status === 'published') {
        const err = validateForPublish(d);
        if (err) { toast(err, 'error'); content.focus(); return false; }
        if (!d.publishedAt) d.publishedAt = today();
      }
      d.status = status;
      d.updatedAt = nowIso();
      const copy = JSON.parse(JSON.stringify(d));
      const idx = data.posts.findIndex((p) => p.id === d.id);
      const backup = idx > -1 ? data.posts[idx] : null;
      if (idx > -1) data.posts[idx] = copy; else data.posts.unshift(copy);
      if (!persist(true)) {
        if (backup) data.posts[idx] = backup; else data.posts.shift();
        return false;
      }
      editorDirty = false;
      return true;
    };

    const saveDraft = () => {
      const wasNew = isNew();
      if (!save('draft')) return;
      if (wasNew) { history.replaceState(null, '', location.pathname + location.search + '#/editor/' + encodeURIComponent(d.id)); lastHash = location.hash; }
      refreshHead();
      toast('Als Entwurf gespeichert.', 'success');
    };
    const publish = () => {
      if (!save('published')) return;
      toast(isLive(d) ? 'Beitrag veröffentlicht!' : `Beitrag geplant für den ${fmtDate(d.publishedAt)}.`, 'success');
      go('#/beitrag/' + encodeURIComponent(d.id));
    };

    $('#ed-draft').onclick = saveDraft;
    $('#ed-publish').onclick = publish;
    $('#ed-preview').onclick = () => {
      collect();
      previewModal(Object.assign({}, d, { tags: [...d.tags] }), {
        foot: `<button class="btn" data-close>${I.edit} Weiter bearbeiten</button><button class="btn btn-primary" data-publish>${I.globe} ${d.status === 'published' ? 'Änderungen veröffentlichen' : 'Jetzt veröffentlichen'}</button>`,
        onPublish: publish
      });
    };
    const delBtn = $('#ed-delete');
    if (delBtn) delBtn.onclick = async () => {
      if (await deletePost(d.id)) { editorDirty = false; go('#/dashboard'); }
    };
    $('#app').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveDraft(); }
    });
  }

  /* ---------- 404 ---------- */
  function viewNotFound(msg = 'Die gesuchte Seite gibt es leider nicht.') {
    mount(`
      <section class="container notfound">
        <div class="big">404</div>
        <h1>Nicht gefunden</h1>
        <p class="muted">${esc(msg)}</p>
        <a class="btn btn-primary" href="#/">${I.back} Zur Startseite</a>
      </section>`, '', 'Nicht gefunden');
  }

  /* ---------- Start ---------- */
  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  async function init() {
    const ok = await loadScript('data/blog-data.js?v=' + Date.now());
    if (!ok) console.warn('data/blog-data.js konnte nicht geladen werden – starte mit leerem Blog.');
    data = loadData();
    route();
  }

  /* Änderungen aus anderen Tabs übernehmen */
  window.addEventListener('storage', (e) => {
    if (e.key === K.data && !editorDirty && data) { data = loadData(); if (getSession()) route(); }
  });

  init();
})();
