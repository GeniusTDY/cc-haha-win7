// strip-cjk-comments.mjs — post-build pass for dist/adapters-chunks/*.mjs
//
// The IM adapter chunks bundle third-party SDKs (@larksuiteoapi, dingtalk,
// grammy) whose sources carry Chinese JSDoc API docs; esbuild preserves
// doc comments attached to statements, so they leak into the artifacts.
// This pass removes every comment that contains CJK text — comments only,
// never string literals — so the repo's no-Chinese-comment invariant holds
// across source rebuilds (the committed runtime/node-fallback chunks are
// already stripped; this keeps fresh dist output identical in kind).
//
// Lexer notes (why this is safe):
//   - full state machine over the source: '…"…' strings, `…` templates
//     with nested ${…} interpolation, /…/x regex literals vs division,
//     //… and /*…*/ comments;
//   - removals are recorded as spans of the ORIGINAL source and spliced
//     out afterwards; a span is only recorded inside a verified comment;
//   - whole-line comments drop their lines; trailing comments drop their
//     preceding whitespace; inline ones are replaced by a single space so
//     adjacent tokens can never join;
//   - the template-interpolation stack must be empty at EOF or the pass
//     refuses to emit (lexer derailed -> no output written).
//   - correctness is proven independently: esbuild --minify-whitespace
//     renders original and stripped sources byte-identically.
import { readFileSync, writeFileSync } from 'node:fs'

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/
const KEYWORDS = new Set(['return','typeof','instanceof','in','of','new','delete','void','throw','case','do','else','yield','await'])

export function stripCjkComments(src) {
  const removals = []
  let i = 0
  const n = src.length
  const tplStack = []
  let braceDepth = 0
  let prevSig = ''

  const wordBefore = () => {
    let j = i - 1
    while (j >= 0 && /[ \t]/.test(src[j])) j--
    let w = ''
    while (j >= 0 && /[a-zA-Z_$0-9]/.test(src[j])) { w = src[j] + w; j-- }
    return w
  }
  const regexAllowed = () => {
    if (prevSig === '') return true
    if (/[a-zA-Z_$]/.test(prevSig)) return KEYWORDS.has(wordBefore())
    if (/[0-9)"'`]/.test(prevSig)) return false
    if (prevSig === ']') return false
    return true
  }

  while (i < n) {
    const c = src[i]

    if (c === "'" || c === '"') {
      i++
      while (i < n) {
        const s = src[i]
        if (s === '\\') { i += 2; continue }
        i++
        if (s === c || s === '\n') break
      }
      prevSig = '"'
      continue
    }

    if (c === '`') {
      i++
      for (;;) {
        if (i >= n) break
        const s = src[i]
        if (s === '\\') { i += 2; continue }
        if (s === '`') { i++; break }
        if (s === '$' && src[i + 1] === '{') { i += 2; tplStack.push(braceDepth); braceDepth = 0; break }
        i++
      }
      prevSig = '`'
      continue
    }

    if (c === '}' && tplStack.length > 0 && braceDepth === 0) {
      braceDepth = tplStack.pop()
      i++
      for (;;) {
        if (i >= n) break
        const s = src[i]
        if (s === '\\') { i += 2; continue }
        if (s === '`') { i++; break }
        if (s === '$' && src[i + 1] === '{') { i += 2; tplStack.push(braceDepth); braceDepth = 0; break }
        i++
      }
      prevSig = '`'
      continue
    }

    if (c === '/' && src[i + 1] === '/') {
      let j = i + 2
      while (j < n && src[j] !== '\n') j++
      if (CJK.test(src.slice(i, j))) removals.push({ start: i, end: j })
      i = j
      continue
    }

    if (c === '/' && src[i + 1] === '*') {
      let j = i + 2
      while (j < n && !(src[j] === '*' && src[j + 1] === '/')) j++
      j = Math.min(j + 2, n)
      if (CJK.test(src.slice(i, j))) removals.push({ start: i, end: j })
      i = j
      continue
    }

    if (c === '/' && regexAllowed()) {
      i++
      let inClass = false
      while (i < n) {
        const s = src[i]
        if (s === '\\') { i += 2; continue }
        if (s === '\n') break
        if (s === '[') inClass = true
        else if (s === ']') inClass = false
        else if (s === '/' && !inClass) { i++; break }
        i++
      }
      prevSig = '/'
      continue
    }

    if (c === '{' && tplStack.length > 0) braceDepth++
    else if (c === '}' && tplStack.length > 0 && braceDepth > 0) braceDepth--

    if (/\S/.test(c)) prevSig = c
    i++
  }

  if (tplStack.length !== 0) {
    throw new Error(`lexer derailed: template stack unbalanced (${tplStack.length} unclosed interpolation level(s)) — refusing to emit`)
  }

  if (removals.length === 0) return { code: src, removedSpans: 0 }

  const expanded = removals.map(r => {
    const ls = (() => { let x = r.start; while (x > 0 && src[x - 1] !== '\n') x--; return x })()
    const le = (() => { let x = r.end; while (x < n && src[x] !== '\n') x++; return x })()
    const before = src.slice(ls, r.start)
    const after = src.slice(r.end, le)
    if (before.trim() === '' && after.trim() === '') {
      return { start: ls, end: le < n ? le + 1 : le }
    }
    if (after.trim() === '' && before.trim() !== '') {
      let s = r.start
      while (s > ls && /[ \t]/.test(src[s - 1])) s--
      return { start: s, end: le }
    }
    return { start: r.start, end: r.end, inline: true }
  })

  let result = ''
  let pos = 0
  for (const r of expanded) {
    if (r.start < pos) continue
    result += src.slice(pos, r.start)
    if (r.inline) {
      const before = src[r.start - 1] ?? ''
      const after = src[r.end] ?? ''
      if (/\S/.test(before) && /\S/.test(after)) result += ' '
    }
    pos = r.end
  }
  result += src.slice(pos)

  return { code: result, removedSpans: removals.length }
}

export function stripCjkCommentsInFile(file) {
  const src = readFileSync(file, 'utf8')
  const { code, removedSpans } = stripCjkComments(src)
  if (removedSpans > 0) {
    writeFileSync(file, code)
    return { removedSpans, savedBytes: src.length - code.length }
  }
  return { removedSpans: 0, savedBytes: 0 }
}
