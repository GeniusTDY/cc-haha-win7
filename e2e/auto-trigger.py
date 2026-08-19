#!/usr/bin/env python3
"""Trigger a bat via Run dialog; auto-dismiss security warning (Alt+R) and UAC (click Yes)."""
import os, subprocess, sys, time, csv, socket

VM = '/workspace/cc-haha/vm'
CMD = sys.argv[1]
OUTFILE = sys.argv[2] if len(sys.argv) > 2 else None
HEADER = sys.argv[3] if len(sys.argv) > 3 else None

def mon(cmd, wait=0.8):
    s = socket.socket(socket.AF_UNIX); s.connect(os.environ.get('QEMU_MON', '/tmp/qemu.sock'))
    time.sleep(0.1)
    try: s.recv(4096)
    except Exception: pass
    s.send((cmd + '\n').encode()); time.sleep(wait); s.close()

def shot(name):
    p = f'{VM}/{name}.ppm'
    mon('screendump ' + p, 1.2)
    subprocess.run(['python3', '-c', f'from PIL import Image; Image.open("{p}").save("{VM}/{name}.png")'], check=False)
    return f'{VM}/{name}.png'

def ocr_words(png):
    subprocess.run(['tesseract', png, '/tmp/autotsv', 'tsv'], capture_output=True)
    words = []
    try:
        for r in csv.reader(open('/tmp/autotsv.tsv'), delimiter='\t'):
            if len(r) >= 12 and r[11].strip() and r[11] != 'text':
                try: words.append((r[11], int(r[6]), int(r[7]), int(r[8]), int(r[9])))
                except ValueError: pass
    except FileNotFoundError: pass
    return words

ns = {}
exec(open(f'{VM}/vncclick.py').read().split('if __name__')[0], ns)
v = ns['VNC']()

# 1) Run dialog + command
subprocess.run(['python3', f'{VM}/run-launch.py', CMD], check=True)
time.sleep(3)
# 2) security warning -> Alt+R
v.key(0xffe9, True); time.sleep(0.05); v.tap(ord('r')); time.sleep(0.05); v.key(0xffe9, False)

# 3) wait for UAC (up to 90s), then click Yes using OCR coords
deadline = time.time() + 90
while time.time() < deadline:
    png = shot('auto-watch')
    words = ocr_words(png)
    txt = ' '.join(w[0].lower() for w in words)
    if 'allow' in txt or 'publisher' in txt or 'command' in txt:
        # Alt+Y = "Yes" accelerator on the Win7 UAC dialog (more reliable than OCR coords)
        v.key(0xffe9, True); time.sleep(0.08); v.tap(ord('y')); time.sleep(0.08); v.key(0xffe9, False)
        print('UAC confirmed via Alt+Y', flush=True)
        break
    time.sleep(3)

# 4) wait for output file header
if OUTFILE and HEADER:
    end = time.time() + 150
    while time.time() < end:
        try:
            if HEADER in open(OUTFILE).read():
                print('header seen', flush=True); break
        except Exception: pass
        time.sleep(4)
print('trigger done', flush=True)
