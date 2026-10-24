/* Public content is plain text and restricted asset paths, never executable markup. */
(() => {
  function apply(content) {
    window.dispatchEvent(new CustomEvent('aci-public-content', {detail:content}));
    document.querySelectorAll('[data-cms]').forEach(el => {
      const value = content[el.dataset.cms];
      if (typeof value === 'string') el.textContent = value;
    });
    const hero = document.querySelector('.hero-bg');
    if (hero && /^\/assets\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp)$/i.test(content['hero-image'] || '')) {
      hero.style.backgroundImage = `linear-gradient(90deg, rgba(5,7,8,.96), rgba(8,12,15,.75) 42%, rgba(8,12,15,.16) 78%), linear-gradient(180deg, rgba(5,7,8,.12), rgba(5,7,8,.68)), url("${content['hero-image']}")`;
    }
    if (hero && /^\d{1,3}$/.test(content['hero-position'] || '')) {
      hero.style.backgroundPosition = `${Math.min(100, Number(content['hero-position']))}% center`;
    }
  }
  if (window.parent === window) fetch('/api/editorial', {cache: 'no-store'})
    .then(r => { if (!r.ok) throw Error(); return r.json(); })
    .then(data => apply(data.content)).catch(() => {});
  // Only the authenticated editor UI served on this origin can send a preview.
  if (window.parent !== window) window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === window.parent && event.data?.type === 'cms-preview') apply(event.data.content || {});
  });
})();
