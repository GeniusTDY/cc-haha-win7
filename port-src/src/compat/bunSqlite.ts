
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function loadNodeSqlite(): typeof import('node:sqlite') {
  try {
    return require('node:sqlite') as typeof import('node:sqlite')
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== 'ERR_UNKNOWN_BUILTIN_MODULE') throw error
    reexecWithSqliteFlag()
  }
}

function reexecWithSqliteFlag(): never {
  const [major, minor] = process.versions.node.replace(/^v/, '').split('.').map(Number)
  const flaggable =
    (major === 22 && minor >= 5 && minor < 13) || (major === 23 && minor < 4)
  if (!flaggable || process.env.CC_HAHA_SQLITE_REEXEC === '1') {
    throw new Error(
      `[cc-haha] node:sqlite is unavailable on Node ${process.versions.node}. ` +
        'Use Node >= 22.5.0 (with --experimental-sqlite on 22.5–22.12) or >= 22.13.0.',
    )
  }
  const result = spawnSync(
    process.execPath,
    [
      ...process.execArgv,
      '--no-warnings=ExperimentalWarning',
      '--experimental-sqlite',
      process.argv[1],
      ...process.argv.slice(2),
    ],
    {
      stdio: 'inherit',
      env: { ...process.env, CC_HAHA_SQLITE_REEXEC: '1' },
    },
  )
  process.exit(result.status ?? (result.signal ? 128 + 2 : 1))
}

const { DatabaseSync } = loadNodeSqlite()
type StatementSync = import('node:sqlite').StatementSync

export type SqliteBinding = null | boolean | number | bigint | string | Uint8Array

export interface SqliteRunResult {
  changes: number | bigint
  lastInsertRowid: number | bigint
}

function normalizeBindings(bindings: SqliteBinding[]): unknown[] {
  return bindings.map(value => (typeof value === 'boolean' ? (value ? 1 : 0) : value))
}

class WrappedStatement {
  constructor(private readonly statement: StatementSync) {}

  get(...bindings: SqliteBinding[]): unknown {
    return this.statement.get(...normalizeBindings(bindings))
  }

  all(...bindings: SqliteBinding[]): unknown[] {
    return this.statement.all(...normalizeBindings(bindings))
  }

  run(...bindings: SqliteBinding[]): SqliteRunResult {
    return this.statement.run(...normalizeBindings(bindings)) as SqliteRunResult
  }

  finalize(): void {
  }
}

export class Database {
  private readonly db: DatabaseSync

  constructor(
    filename: string,
    options?: { create?: boolean; readonly?: boolean },
  ) {
    this.db = new DatabaseSync(filename, {
      open: true,
      readOnly: options?.readonly ?? false,
    })
  }

  exec(sql: string): void {
    this.db.exec(sql)
  }

  query(sql: string): WrappedStatement {
    return new WrappedStatement(this.db.prepare(sql))
  }

  prepare(sql: string): WrappedStatement {
    return this.query(sql)
  }

  clearQueryCache(): void {
  }

  close(_force?: boolean): void {
    this.db.close()
  }
}

export default { Database }
