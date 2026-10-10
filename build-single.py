#!/usr/bin/env python3
"""Build a single self-contained HTML file (no internet, no hosting needed).

Usage: python3 build-single.py   ->  writes Εξοδολόγιο.html

If config.local.json exists (git-ignored), its email / subject / company and
logo (path to an image) are baked in as the app's default settings.
"""
import base64
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / 'Εξοδολόγιο.html'


def read(p):
    return (ROOT / p).read_text(encoding='utf-8')


def data_uri(p, mime):
    return f'data:{mime};base64,' + base64.b64encode((ROOT / p).read_bytes()).decode()


def script_safe(js):
    return js.replace('</script', '<\\/script')


def replace_once(html, old, new):
    if html.count(old) != 1:
        raise SystemExit(f'Expected exactly one occurrence of: {old!r}')
    return html.replace(old, new)


html = read('index.html')
icon = data_uri('icons/icon-192.png', 'image/png')
html = replace_once(html, '<link rel="manifest" href="manifest.webmanifest">\n', '')
html = replace_once(html, '<link rel="icon" href="icons/icon-192.png">', f'<link rel="icon" href="{icon}">')
html = replace_once(html, '<link rel="apple-touch-icon" href="icons/icon-180.png">',
                    f'<link rel="apple-touch-icon" href="{data_uri("icons/icon-180.png", "image/png")}">')
cfg_path = ROOT / 'config.local.json'
cfg = json.loads(cfg_path.read_text(encoding='utf-8')) if cfg_path.exists() else {}
if cfg.get('logo'):
    ext = cfg['logo'].rsplit('.', 1)[-1].lower()
    cfg['logo'] = data_uri(cfg['logo'], 'image/png' if ext == 'png' else 'image/jpeg')
html = replace_once(html, "if ('serviceWorker' in navigator && location.protocol !== 'file:')",
                    "if (false)")

inline = (
    '<script type="text/plain" id="inline-pdfjs-worker">'
    + script_safe(read('vendor/pdf.worker.min.js')) + '</script>\n'
    + '<script type="text/plain" id="inline-pdfjs">'
    + script_safe(read('vendor/pdf.min.js')) + '</script>\n'
    + '<script>' + script_safe(read('vendor/jspdf.umd.min.js')) + '</script>\n'
    + '<script>window.EXODOLOGIO_CONFIG = ' + script_safe(json.dumps(cfg, ensure_ascii=False)) + ';</script>'
)
html = replace_once(html, '<script src="vendor/jspdf.umd.min.js"></script>', inline)

OUT.write_text(html, encoding='utf-8')
print(f'{OUT.name}: {OUT.stat().st_size / 1024 / 1024:.2f} MB')
