#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'

import { fs as mfs, promise as mpromise } from '@materya/base'
import { createPool, sql } from 'slonik'

import type {
  DatabasePoolConnectionType,
} from 'slonik'

import { argsParser } from '../tools'

// No type support for this package - force a require instead
// import { raw } from 'slonik-sql-tag-raw'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { raw } = require('slonik-sql-tag-raw')

const rcfile = '.materyarc.json'
const migrationTableName = '_migrations'

const rcpath = mfs.find.up(process.cwd(), rcfile)

const config = JSON.parse(fs.readFileSync(rcpath, 'utf8'))

const root = path.dirname(rcpath)

const migrationsPath = `${root}/${config.migrations.path ?? 'migrations'}`

const { DATABASE_URL } = process.env

if (!DATABASE_URL) throw new Error('Missing env var DATABASE_URL')

const initMigrationsTable = async (
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  const existsQueryResult = await connection.query(sql`SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = ${migrationTableName}
  );`)

  const isTableExist = existsQueryResult.rows[0].exists as unknown as boolean
  if (!isTableExist) {
    await connection.query(sql`
      CREATE TABLE ${sql.identifier([migrationTableName])} (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date TIMESTAMP DEFAULT current_timestamp
      );
    `)
  }
}

const createMigration = async (
  name: string,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  await connection.query(sql`
    INSERT INTO ${sql.identifier([migrationTableName])} (
      name
    ) VALUES (${name});
  `)
}

const deleteMigration = async (
  name: string,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  await connection.query(sql`
    DELETE FROM ${sql.identifier([migrationTableName])}
    WHERE name = ${name};
  `)
}

const getMigrations = async (
  connection: DatabasePoolConnectionType,
): Promise<Array<string>> => {
  const migrations = await connection.query(sql`
    SELECT name FROM ${sql.identifier([migrationTableName])};
  `)
  const names = migrations.rows.map(row => row.name)
  return names as Array<string>
}

const up = async (
  migrations: Array<string>,
  appliedMigrations: Array<string>,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  await mpromise.sequential(migrations, async (migration: string) => {
    process.stdout.write(`processing ${migration} ... `)
    if (appliedMigrations.includes(migration)) {
      process.stdout.write('SKIP\n')
    } else {
      const tasks = await import(`${migrationsPath}/${migration}`)
      const task = tasks.up
      task && await connection.query(task(sql, raw))
      await createMigration(migration, connection)
      process.stdout.write('DONE\n')
    }
  })
}

const down = async (
  migrations: Array<string>,
  appliedMigrations: Array<string>,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  const rMigrations = migrations.slice().reverse()
  const rAppliedMigrations = appliedMigrations.slice().reverse()
  await mpromise.sequential(rAppliedMigrations, async (migration: string) => {
    process.stdout.write(`processing ${migration} ... `)

    if (!rMigrations.includes(migration)) {
      process.stdout.write('ERROR\n')
      throw new Error(`referenced applied migration ${migration} not found.`)
    }

    const tasks = await import(`${migrationsPath}/${migration}`)
    const task = tasks.down
    task && await connection.query(task(sql, raw))
    await deleteMigration(migration, connection)
    process.stdout.write('DONE\n')
  })
}

const main = async (): Promise<void> => {
  const pool = createPool(DATABASE_URL)
  const args = argsParser({ commands: ['up', 'down'] })
  const { command } = args
  const migrations = fs.readdirSync(migrationsPath)

  if (migrations.length === 0) {
    process.stdout.write('no migrations found.')
    return
  }

  await pool.connect(async connection => {
    await initMigrationsTable(connection)
    const appliedMigrations = await getMigrations(connection)
    command === 'up' && await up(migrations, appliedMigrations, connection)
    command === 'down' && await down(migrations, appliedMigrations, connection)
  })
}

if (require.main === module) {
  main()
}
