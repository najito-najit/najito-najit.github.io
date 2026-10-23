// 動画ライブラリを tools/videos.json から作り、index.html の
// <!-- LIBRARY:START --> と <!-- LIBRARY:END --> の間を置き換える。
// サムネイルは images/thumbs/<動画id>.jpg があれば表示する（無ければ「▶ ここで再生」ボタン）。
// 使い方: node tools/build-diary.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'videos.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const all = new Map();
data.groups.forEach(g => g.items.forEach(v => all.set(v.id, v)));
const missing = [];
data.groups.forEach(g => g.items.forEach(v => (v.rel || []).forEach(r => { if (!all.has(r)) missing.push(v.id + ' -> ' + r); })));
if (missing.length) { console.error('rel に存在しないidがあります:\n' + missing.join('\n')); process.exit(1); }

const fmt = d => { const p = d.split('-'); return Number(p[1]) + '/' + Number(p[2]) + ' 公開'; };
const shortTitle = t => t.replace(/【.*?】/g, '').replace(/ \| .*$/, '');
let html = '';
let thumbs = 0;
data.groups.forEach(g => {
  html += '    <h3 class="vgroup">' + esc(g.title) + '</h3>\n';
  if (g.lead) html += '    <p class="vlead">' + esc(g.lead) + '</p>\n';
  html += '    <div class="vlist">\n';
  g.items.forEach((v, i) => {
    const long = v.kind === 'long';
    const watch = (long ? 'https://www.youtube.com/watch?v=' : 'https://www.youtube.com/shorts/') + v.id;
    const kindLabel = long ? '通常動画' : 'ショート';
    const thumbFile = 'images/thumbs/' + v.id + '.jpg';
    const hasThumb = fs.existsSync(path.join(root, thumbFile));
    if (hasThumb) thumbs++;
    const dim = long ? 'width="150" height="84"' : 'width="90" height="160"';
    const attrs = 'href="' + esc(watch) + '" data-id="' + esc(v.id) + '" data-kind="' + esc(v.kind) + '" data-title="' + esc(v.title) + '"';
    html += '      <article class="vid" id="v-' + esc(v.id) + '">\n';
    if (hasThumb) {
      html += '        <a class="play vthumb ' + esc(v.kind) + '" ' + attrs + ' aria-label="再生：' + esc(v.title) + '"><img src="' + thumbFile + '" ' + dim + ' alt="" loading="lazy"><span class="vplay" aria-hidden="true">▶</span></a>\n';
    }
    html += '        <div class="vbody">\n';
    html += '          <div class="vhead"><span class="vno">' + (i + 1) + '</span><h4 class="vtitle">' + esc(v.title) + '</h4></div>\n';
    html += '          <p class="vmeta">' + esc(fmt(v.date)) + '　' + kindLabel + '</p>\n';
    if (v.note) html += '          <p class="vnote">' + esc(v.note) + '</p>\n';
    html += '          <div class="vact">' + (hasThumb ? '' : '<a class="play btnplay" ' + attrs + '>▶ ここで再生</a>') + '<a class="ytlink" href="' + esc(watch) + '">YouTubeで見る</a></div>\n';
    if (v.rel && v.rel.length) {
      html += '          <p class="vrel">関連：' + v.rel.map(r => '<a href="#v-' + esc(r) + '">' + esc(shortTitle(all.get(r).title)) + '</a>').join('　') + '</p>\n';
    }
    html += '        </div>\n';
    html += '      </article>\n';
  });
  html += '    </div>\n';
});

const file = path.join(root, 'index.html');
const src = fs.readFileSync(file, 'utf8');
const re = /<!-- LIBRARY:START -->[\s\S]*?<!-- LIBRARY:END -->/;
if (!re.test(src)) { console.error('index.html にマーカーがありません'); process.exit(1); }
const out = src.replace(re, () => '<!-- LIBRARY:START -->\n' + html + '    <!-- LIBRARY:END -->');
fs.writeFileSync(file, out);
console.log('生成しました: ' + all.size + ' 本 / ' + data.groups.length + ' グループ / サムネイルあり ' + thumbs + ' 本');
