# Elsewhere · Apogeans: The Limit Breakers · NASA Space Apps Challenge 2026
#
# AI ASSISTANCE NOTICE
# AI (Anthropic's Claude) helped us analyze the immense amount of data behind this
# app: elevation, climate, geology and surface datasets for Earth, the Moon and
# Mars, and turning it into the 16 feature scores and similarity matches the app
# uses. AI also helped write and debug parts of this code. See README.md.

"""Turn the Elsewhere web page into the paged Android app page: assets/www/index.html."""
import base64, pathlib, re, sys

R = pathlib.Path(__file__).resolve().parents[2]
src = (R / 'src/app/index.html').read_text(encoding='utf-8')
sh = R / 'src/shell'

def cut(start, end, s=None, inclusive_end=True):
    s = src if s is None else s
    i = s.index(start); j = s.index(end, i + len(start))
    return s[i:j + (len(end) if inclusive_end else 0)]

parts = {
    'SEARCH': cut('<form class="search" id="form"', '</form>'),
    'CHECKER': cut('<section class="card checker" id="checker">', '</section>'),
    'MAPCARD': cut('<div class="card">\n      <div class="mapbox">', '</ul>\n    </div>'),
    'LEGEND': cut('<div class="legend">', '</div>\n  </header>', inclusive_end=False) + '</div>',
    'DOSSIER': cut('<section class="card dossier" id="dossier"', '</section>'),
    'EXPLORE': cut('<section class="card explore" id="explore">', '</section>'),
    'HINT': cut('<p class="method" id="hint">', '</p>'),
}
body = (sh / 'shell.html').read_text(encoding='utf-8')
for k, v in parts.items():
    assert '{{%s}}' % k in body, k
    body = body.replace('{{%s}}' % k, v)

# old page body: from <div class="wrap"> to the closing </div> before the scripts
a = src.index('<div class="wrap">')
b = src.index('<script src="https://cdnjs.cloudflare.com/ajax/libs/d3')
out = src[:a] + body + '\n\n' + src[b:]

# offline fonts
F = R / 'vendor/fonts'
faces = []
for fam, pkg, w in [('Jost', 'fontsource-jost-5.2.8', [200, 300, 400, 500, 600]), ('IBM Plex Mono', 'fontsource-ibm-plex-mono-5.3.0', [400, 500])]:
    d = next(F.glob(pkg.split('-5.')[0] + '-*/package/files'))
    slug = fam.lower().replace(' ', '-')
    for x in w:
        b64 = base64.b64encode((d / f'{slug}-latin-{x}-normal.woff2').read_bytes()).decode()
        faces.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{x};font-display:swap;src:url(data:font/woff2;base64,{b64}) format('woff2')}}")
out = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>', '', out, count=1)
out = out.replace('</style>', '</style>\n<style>\n' + '\n'.join(faces) + '\n' + (sh / 'shell.css').read_text(encoding='utf-8') + '\n</style>', 1)
out = out.replace('<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"><meta name="theme-color" content="#07090C">', 1)

# libraries inline
for tag, lib in (('<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>', 'vendor/libs/d3-7.8.5/package/dist/d3.min.js'),
                 ('<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>', 'vendor/libs/topojson-3.0.2/package/dist/topojson.min.js')):
    assert tag in out
    out = out.replace(tag, '<script>\n' + (R / lib).read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>', 1)

# shell script after the app script
last = out.rindex('</script>')
out = out[:last + 9] + '\n<script>\n' + (sh / 'shell.js').read_text(encoding='utf-8') + '\n</script>\n<script>\n' + (sh / 'features.js').read_text(encoding='utf-8') + '\n</script>\n<script>\n' + (sh / 'photo.js').read_text(encoding='utf-8') + '\n</script>\n<script>\n' + (sh / 'tools.js').read_text(encoding='utf-8') + '\n</script>\n<script>\n' + (sh / 'present.js').read_text(encoding='utf-8') + '\n</script>\n' + out[last + 9:]

# one build, two homes: the Android app and the playable web app at the repo root
dst = R / 'android/assets/www/index.html'
dst.write_text(out, encoding='utf-8')
(R / 'index.html').write_text(out, encoding='utf-8')
print('ok', len(out))
