// Self-contained report UI: works from file:// without fetching scripts or data.
export const viewerStyle = `
  .evidence-image{display:inline-block;max-width:600px;width:100%;cursor:zoom-in}
  .evidence-image img{margin:8px 0;display:block}
  #evidence-viewer{width:95vw;max-width:none;height:92vh;max-height:95vh;padding:0;border:0;border-radius:10px;background:#101827;color:#fff}
  #evidence-viewer::backdrop{background:#000b}
  .viewer-toolbar{display:flex;align-items:center;gap:12px;padding:12px;flex-wrap:wrap}
  #viewer-caption{flex:1;overflow-wrap:anywhere}
  .viewer-toolbar button,.viewer-toolbar a{font:inherit;color:#fff;background:#24344d;border:1px solid #64748b;border-radius:6px;padding:8px;cursor:pointer}
  .viewer-toolbar button:disabled{opacity:.4;cursor:default}
  #viewer-stage{height:calc(100% - 90px);overflow:auto;text-align:center}
  #viewer-image{width:auto;height:auto;max-width:100%;max-height:100%;margin:0;border:0;cursor:zoom-in}
  #viewer-image.zoomed{max-width:none;max-height:none;cursor:zoom-out}
`;

export const viewerMarkup = `
<dialog id="evidence-viewer" aria-label="Ảnh minh chứng">
  <div class="viewer-toolbar">
    <button id="viewer-prev" type="button" aria-label="Ảnh trước">←</button>
    <button id="viewer-next" type="button" aria-label="Ảnh tiếp">→</button>
    <span id="viewer-caption" aria-live="polite"></span>
    <a id="viewer-original" target="_blank" rel="noopener">Mở ảnh gốc ↗</a>
    <button id="viewer-close" type="button">Đóng (Esc)</button>
  </div>
  <div id="viewer-stage"><img id="viewer-image" alt=""></div>
</dialog>
<script>
(() => {
  const dialog = document.getElementById('evidence-viewer');
  const image = document.getElementById('viewer-image');
  const caption = document.getElementById('viewer-caption');
  const previous = document.getElementById('viewer-prev');
  const next = document.getElementById('viewer-next');
  const sections = [...document.querySelectorAll('details[data-case-id]')];
  const key = 'englishhub-report:' + location.pathname;
  let links = [], index = 0, opener, position = 0, restoring = true;
  function save() {
    if (restoring) return;
    const state = {open: sections.filter(s => s.open).map(s => s.dataset.caseId), y: dialog.open ? position : scrollY};
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch {}
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (saved) {
      sections.forEach(s => { s.open = saved.open.includes(s.dataset.caseId); });
      requestAnimationFrame(() => requestAnimationFrame(() => { scrollTo(0, saved.y); restoring = false; }));
    } else restoring = false;
  } catch { restoring = false; }
  sections.forEach(s => s.addEventListener('toggle', save));
  let timer;
  addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(save, 150); }, {passive:true});
  addEventListener('pagehide', save);
  function show() {
    const link = links[index];
    image.classList.remove('zoomed');
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    caption.textContent = opener.closest('details').dataset.caseId + ' · ' + (index + 1) + '/' + links.length + ' · ' + link.getAttribute('href').split('/').pop();
    document.getElementById('viewer-original').href = link.href;
    previous.disabled = index === 0;
    next.disabled = index === links.length - 1;
    document.getElementById('viewer-stage').scrollTo(0, 0);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a.evidence-image');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    opener = link;
    position = scrollY;
    save();
    links = [...link.closest('details').querySelectorAll('a.evidence-image')];
    index = links.indexOf(link);
    show();
    dialog.showModal();
    document.getElementById('viewer-close').focus({preventScroll:true});
  });
  previous.onclick = () => { if (index > 0) { index--; show(); } };
  next.onclick = () => { if (index < links.length - 1) { index++; show(); } };
  image.onclick = () => image.classList.toggle('zoomed');
  document.getElementById('viewer-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous.click(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); next.click(); }
  });
  dialog.addEventListener('close', () => {
    opener?.focus({preventScroll:true});
    scrollTo(0, position);
    save();
  });
})();
</script>`;
