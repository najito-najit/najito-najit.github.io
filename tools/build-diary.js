// 動画ライブラリを tools/videos.json から作り、index.html の
// <!-- LIBRARY:START --> と <!-- LIBRARY:END --> の間を置き換える。
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

const fmt = d => { const [y, m, dd] = d.split('-'); return Number(m) + '/' + Number(dd) + ' 公開'; };
let html = '';
data.groups.forEach(g => {
  html += '    <h3 class="vgroup">' + esc(g.title) + '</h3>\n';
  if (g.lead) html += '    <p class="vlead">' + esc(g.lead) + '</p>\n';
  html += '    <div class="vlist">\n';
  g.items.forEach((v, i) => {
    const watch = v.kind === 'long' ? 'https://www.youtube.com/watch?v=' + v.id : 'https://www.youtube.com/shorts/' + v.id;
    const kindLabel = v.kind === 'long' ? '通常動画' : 'ショート';
    html += '      <article class="vid" id="v-' + esc(v.id) + '">\n';
    html += '        <div class="vhead"><span class="vno">' + (i + 1) + '</span><h4 class="vtitle">' + esc(v.title) + '</h4></div>\n';
    html += '        <p class="vmeta">' + esc(fmt(v.date)) + '　' + kindLabel + '</p>\n';
    if (v.note) html += '        <p class="vnote">' + esc(v.note) + '</p>\n';
    html += '        <div class="vact"><a class="play" href="' + esc(watch) + '" data-id="' + esc(v.id) + '" data-kind="' + esc(v.kind) + '" data-title="' + esc(v.title) + '">▶ ここで再生</a><a class="ytlink" href="' + esc(watch) + '">YouTubeで見る</a></div>\n';
    if (v.rel && v.rel.length) {
      html += '        <p class="vrel">関連：' + v.rel.map(r => '<a href="#v-' + esc(r) + '">' + esc(all.get(r).title.replace(/【.*?】/g, '').replace(/ \| .*$/, '')) + '</a>').join('　') + '</p>\n';
    }
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
console.log('生成しました: ' + all.size + ' 本 / ' + data.groups.length + ' グループ');
