/* Najit site: carry the visitor's source (?s=yt|ig|tt|x|note|zenn, optional &c=campaign)
   to the Google Play links as an install referrer (UTM). No cookies, no external services.
   The value is kept only in sessionStorage so the JA/EN switch keeps it. */
(function () {
  var q = new URLSearchParams(location.search);
  var s = q.get('s'), c = q.get('c');
  try {
    if (s) sessionStorage.setItem('najit_s', s);
    if (c) sessionStorage.setItem('najit_c', c);
    s = s || sessionStorage.getItem('najit_s');
    c = c || sessionStorage.getItem('najit_c');
  } catch (e) {}
  if (!s) return;
  var map = { yt: 'youtube', ig: 'instagram', tt: 'tiktok', x: 'x', note: 'note', zenn: 'zenn' };
  var clean = function (v, n) { return String(v || '').replace(/[^a-z0-9_-]/gi, '').slice(0, n); };
  var src = map[clean(s, 12)] || clean(s, 20);
  if (!src) return;
  var lang = document.documentElement.lang === 'en' ? 'en' : 'ja';
  var cc = clean(c, 40);
  var camp = 'home_' + lang + (cc ? '_' + cc : '');
  var ref = encodeURIComponent('utm_source=' + src + '&utm_medium=site&utm_campaign=' + camp);
  var links = document.querySelectorAll('a[href^="https://play.google.com/store/apps/details"]');
  for (var i = 0; i < links.length; i++) {
    var u = links[i].getAttribute('href');
    if (u.indexOf('referrer=') < 0) links[i].setAttribute('href', u + (u.indexOf('?') < 0 ? '?' : '&') + 'referrer=' + ref);
  }
  var sw = document.querySelectorAll('a[hreflang], a[data-keep]');
  for (var j = 0; j < sw.length; j++) {
    var h = sw[j].getAttribute('href');
    if (h.indexOf('?') < 0) sw[j].setAttribute('href', h + '?s=' + encodeURIComponent(clean(s, 12)) + (cc ? '&c=' + cc : ''));
  }
})();
