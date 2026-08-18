#!/usr/bin/env python3
import sys, time, socket, struct

HOST, PORT = "127.0.0.1", 5905
text = sys.argv[1]
gap = float(sys.argv[2]) if len(sys.argv) > 2 else 0.15

s = socket.create_connection((HOST, PORT), timeout=10)
s.settimeout(10)
ver = s.recv(12)
s.sendall(b"RFB 003.008\n")
n = s.recv(1)[0]
if n: s.recv(n)
else: s.recv(4)
s.sendall(bytes([1])); s.recv(4)
s.sendall(b"\x01")
s.recv(4); s.recv(16)
nl = struct.unpack(">I", s.recv(4))[0]
if nl: s.recv(nl)

def key(sym, down):
    s.sendall(struct.pack(">BBxxI", 4, 1 if down else 0, sym))

def tap(sym, hold=0.06):
    key(sym, True); time.sleep(hold); key(sym, False); time.sleep(gap)

for ch in text:
    o = ord(ch)
    if ch.isupper():
        key(0xFFE1, True); tap(o); key(0xFFE1, False)
    else:
        tap(o)
print("typed", len(text), "chars")
