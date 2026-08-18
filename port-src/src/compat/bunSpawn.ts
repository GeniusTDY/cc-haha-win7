/**
 * Node.js port: Bun.spawn() compatibility shim.
 *
 * Implements the subset of Bun.spawn semantics used by cc-haha:
 *  - opts: cwd, env, stdin/stdout/stderr ('inherit'|'pipe'|'ignore'),
 *          argv0, windowsHide, onExit
 *  - returned object: pid, stdin (Writable), stdout/stderr (hybrid
 *    ReadableStream with .text()/.json(), usable as Response body and as
 *    async iterable), exited (Promise<number>), kill(signalOrCode)
 */

import { spawn, type ChildProcess } from 'node:child_process'
import type { Readable } from 'node:stream'

export type NodeBunStdioOption = 'inherit' | 'pipe' | 'ignore'

export interface NodeBunSpawnOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>
  stdin?: NodeBunStdioOption
  stdout?: NodeBunStdioOption
  stderr?: NodeBunStdioOption
  argv0?: string
  windowsHide?: boolean
  onExit?: (exitCode: number | null, signalCode: NodeJS.Signals | null) => void
  killSignal?: NodeJS.Signals
}

/** ReadableStream with Bun-style Blob helpers, usable as a Response body. */
export class HybridReadableStream extends ReadableStream<Uint8Array> {
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
}

function toHybrid(nodeStream: Readable): HybridReadableStream {
  return new HybridReadableStream({
    start(controller) {
      nodeStream.on('data', chunk => {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
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
    cancel() {
      nodeStream.destroy()
    },
  })
}

export interface NodeBunSubprocess {
  pid: number | undefined
  stdin: NodeJS.WritableStream | null
  stdout: HybridReadableStream | null
  stderr: HybridReadableStream | null
  exited: Promise<number>
  exitCode: Promise<number>
  kill(signalOrExitCode?: NodeJS.Signals | number): boolean
  readonly nodeChild: ChildProcess
}

export function nodeBunSpawn(
  command: string[] | string,
  options: NodeBunSpawnOptions = {},
): NodeBunSubprocess {
  const cmdList = Array.isArray(command) ? command : [command]
  const program = cmdList[0]!
  const args = cmdList.slice(1)

  const stdio: ('inherit' | 'pipe' | 'ignore')[] = [
    options.stdin ?? 'pipe',
    options.stdout ?? 'pipe',
    options.stderr ?? 'pipe',
  ]

  const child = spawn(program, args, {
    cwd: options.cwd,
    env: options.env as NodeJS.ProcessEnv | undefined,
    stdio,
    argv0: options.argv0,
    windowsHide: options.windowsHide,
  })

  const exited = new Promise<number>(resolve => {
    child.on('exit', (code, signal) => {
      options.onExit?.(code, signal)
      // Bun resolves `exited` to the exit code; signal-killed → non-zero.
      resolve(code ?? (signal ? 1 : 0))
    })
    child.on('error', () => {
      // spawn failures (ENOENT etc.) also settle `exited`.
      resolve(1)
    })
  })

  const makePipe = (side: 'stdout' | 'stderr'): HybridReadableStream | null => {
    const opt = side === 'stdout' ? options.stdout : options.stderr
    if (opt === 'pipe' && child[side]) return toHybrid(child[side]!)
    return null
  }

  return {
    pid: child.pid,
    stdin: options.stdin === 'ignore' || options.stdin === 'inherit' ? null : child.stdin,
    stdout: makePipe('stdout'),
    stderr: makePipe('stderr'),
    exited,
    exitCode: exited,
    kill(signalOrExitCode?: NodeJS.Signals | number): boolean {
      try {
        if (typeof signalOrExitCode === 'string') {
          return child.kill(signalOrExitCode)
        }
        return child.kill()
      } catch {
        return false
      }
    },
    get nodeChild(): ChildProcess {
      return child
    },
  }
}
