#!/usr/bin/env node

import * as fs from 'fs'

import { env, promise } from '@materya/carbon'
import debug from 'debug'
import { createPool, sql } from 'slonik'

import type {
  DatabasePoolConnectionType,
} from 'slonik'

import { argsParser, rc } from '../tools'

// No type support for this package - force a require instead
// import { raw } from 'slonik-sql-tag-raw'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { raw } = require('slonik-sql-tag-raw')

const log = debug('materya:quartz:migrate')

const migrationTableName = '_migrations'

const defaultName = 'migrations'
const migrationsPath = `${rc.root}/${rc.config.migrations.path ?? defaultName}`

// const uriString = config.uri ?? process.env.DATABASE_URL
const uriString = env.get('NODE_ENV', 'production') === 'production'
  ? env.get('DATABASE_URL')
  : `${env.get('DATABASE_URL')}_${env.get('NODE_ENV')}`

if (!uriString) throw new Error('Missing DB URI config or env variable.')

const initMigrationsTable = async (
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  try {
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
  } catch (error) {
    log('unable to create `_migrations` table: ', error)
  }
}

const createMigration = async (
  name: string,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  try {
    await connection.query(sql`
      INSERT INTO ${sql.identifier([migrationTableName])}
      (name)
      VALUES (${name});
    `)
  } catch (error) {
    log(`unable to insert migration ${name}: `, error)
  }
}

const deleteMigration = async (
  name: string,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  try {
    await connection.query(sql`
      DELETE FROM ${sql.identifier([migrationTableName])}
      WHERE name = ${name};
    `)
  } catch (error) {
    log(`unable to delete migration ${name}: `, error)
  }
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
  await promise.sequential(migrations, async (migration: string) => {
    process.stdout.write(`processing ${migration} ... `)
    if (appliedMigrations.includes(migration)) {
      process.stdout.write('SKIP\n')
    } else {
      const tasks = await import(`${migrationsPath}/${migration}`)
      const task = tasks.up(sql, raw)
      if (Array.isArray(task)) {
        await connection.transaction(async t => (
          Promise.all(task.map(async query => t.query(query)))
        ))
      } else {
        await connection.query(task)
      }
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
  await promise.sequential(rAppliedMigrations, async (migration: string) => {
    process.stdout.write(`processing ${migration} ... `)

    if (!rMigrations.includes(migration)) {
      process.stdout.write('ERROR\n')
      throw new Error(`referenced applied migration ${migration} not found.`)
    }

    const tasks = await import(`${migrationsPath}/${migration}`)
    const task = tasks.down(sql, raw)
    if (Array.isArray(task)) {
      await connection.transaction(async t => (
        Promise.all(task.map(async query => t.query(query)))
      ))
    } else {
      await connection.query(task)
    }
    await deleteMigration(migration, connection)
    process.stdout.write('DONE\n')
  })
}

const main = async (): Promise<void> => {
  try {
    const pool = createPool(uriString)
    const args = argsParser({ commands: ['up', 'down'] })
    const { command } = args
    const migrations = fs.readdirSync(migrationsPath)

    if (migrations.length === 0) {
      process.stdout.write('no migrations found.')
      return
    }

    await pool.connect(async connection => {
      await initMigrationsTable(connection)
      const applied = await getMigrations(connection)
      command === 'up' && await up(migrations, applied, connection)
      command === 'down' && await down(migrations, applied, connection)
    })
  } catch (error) {
    log('unable to process migration: ', error)
  }
}

if (require.main === module) {
  main()
}
