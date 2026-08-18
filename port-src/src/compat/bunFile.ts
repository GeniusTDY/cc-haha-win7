/**
 * Node.js port: Bun.file() compatibility shim.
 *
 * Returns a ReadableStream subclass (so `new Response(file)` accepts it as a
 * body) carrying Bun File semantics used by cc-haha:
 *   file.size / file.type / file.slice(start, endExclusive) / file.text()
 *   file.stream() is the object itself (it IS a ReadableStream).
 *
 * Slicing maps to fs.createReadStream({ start, end }) windows, so Range
 * requests stream from disk without buffering.
 */

import { createReadStream, statSync } from 'node:fs'
import { extname } from 'node:path'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
}

export class NodeBunFile extends ReadableStream<Uint8Array> {
  readonly path: string
  private readonly start: number | undefined
  private readonly endExclusive: number | undefined

  constructor(path: string, start?: number, endExclusive?: number) {
    super({
      start(controller) {
        let nodeStream: ReturnType<typeof createReadStream> | null = null
        try {
          nodeStream = createReadStream(path, {
            start,
            end: endExclusive === undefined ? undefined : endExclusive - 1,
          })
        } catch (err) {
          controller.error(err as Error)
          return
        }
        nodeStream.on('data', chunk => {
          const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
          controller.enqueue(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength))
        })
        nodeStream.on('end', () => {
          try {
            controller.close()
          } catch {
            // already closed
          }
        })
        nodeStream.on('error', err => {
          try {
            controller.error(err)
          } catch {
            // already closed
          }
        })
      },
    })
    this.path = path
    this.start = start
    this.endExclusive = endExclusive
  }

  get size(): number {
    const total = statSync(this.path).size
    if (this.start === undefined && this.endExclusive === undefined) return total
    const from = this.start ?? 0
    const to = Math.min(this.endExclusive ?? total, total)
    return Math.max(0, to - from)
  }

  get type(): string {
    return MIME_TYPES[extname(this.path).toLowerCase()] ?? 'application/octet-stream'
  }

  get name(): string {
    return this.path.split(/[\\/]/).pop() ?? this.path
  }

  get lastModified(): number {
    return statSync(this.path).mtimeMs
  }

  /** Bun slice: [start, endExclusive) relative to this file's window. */
  slice(sliceStart: number, sliceEndExclusive?: number): NodeBunFile {
    const base = this.start ?? 0
    const total = statSync(this.path).size
    const from = base + Math.max(0, sliceStart)
    const to =
      sliceEndExclusive === undefined
        ? (this.endExclusive ?? total)
        : base + sliceEndExclusive
    return new NodeBunFile(this.path, from, to)
  }

  stream(): ReadableStream<Uint8Array> {
    return this
  }

  async text(): Promise<string> {
    const reader = this.getReader()
    const chunks: Buffer[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(Buffer.from(value.buffer, value.byteOffset, value.byteLength))
    }
    return Buffer.concat(chunks).toString('utf8')
  }

  async json(): Promise<unknown> {
    return JSON.parse(await this.text())
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const reader = this.getReader()
    const chunks: Buffer[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(Buffer.from(value.buffer, value.byteOffset, value.byteLength))
    }
    const joined = Buffer.concat(chunks)
    return joined.buffer.slice(joined.byteOffset, joined.byteOffset + joined.byteLength)
  }
}

export function nodeBunFile(path: string): NodeBunFile {
  return new NodeBunFile(path)
}

export default nodeBunFile
