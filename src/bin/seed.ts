#!/usr/bin/env node

import * as fs from 'fs'

import { promise as mpromise } from '@materya/base'
import { createPool, sql } from 'slonik'

import type {
  DatabasePoolConnectionType,
} from 'slonik'

import { argsParser, rc } from '../tools'

// No type support for this package - force a require instead
// import { raw } from 'slonik-sql-tag-raw'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { raw } = require('slonik-sql-tag-raw')

const seedsTableName = '_seeds'

const defaultName = 'seeds'
const seedsPath = `${rc.root}/${rc.config.seeds.path ?? defaultName}`

// const uriString = config.uri ?? process.env.DATABASE_URL
const uriString = process.env.DATABASE_URL

if (!uriString) throw new Error('Missing DB URI config or env variable.')

const initSeedsTable = async (
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  const existsQueryResult = await connection.query(sql`SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = ${seedsTableName}
  );`)

  const isTableExist = existsQueryResult.rows[0].exists as unknown as boolean
  if (!isTableExist) {
    await connection.query(sql`
      CREATE TABLE ${sql.identifier([seedsTableName])} (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date TIMESTAMP DEFAULT current_timestamp
      );
    `)
  }
}

const createSeed = async (
  name: string,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  await connection.query(sql`
    INSERT INTO ${sql.identifier([seedsTableName])} (
      name
    ) VALUES (${name});
  `)
}

const deleteSeed = async (
  name: string,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  await connection.query(sql`
    DELETE FROM ${sql.identifier([seedsTableName])}
    WHERE name = ${name};
  `)
}

const getSeeds = async (
  connection: DatabasePoolConnectionType,
): Promise<Array<string>> => {
  const seeds = await connection.query(sql`
    SELECT name FROM ${sql.identifier([seedsTableName])};
  `)
  const names = seeds.rows.map(row => row.name)
  return names as Array<string>
}

const up = async (
  seeds: Array<string>,
  applied: Array<string>,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  await mpromise.sequential(seeds, async (seed: string) => {
    process.stdout.write(`processing ${seed} ... `)
    if (applied.includes(seed)) {
      process.stdout.write('SKIP\n')
    } else {
      const tasks = await import(`${seedsPath}/${seed}`)
      const task = tasks.up
      task && await connection.query(await task(sql, raw, connection.query))
      await createSeed(seed, connection)
      process.stdout.write('DONE\n')
    }
  })
}

const down = async (
  seeds: Array<string>,
  applied: Array<string>,
  connection: DatabasePoolConnectionType,
): Promise<void> => {
  const reversed = applied.slice().reverse()
  await mpromise.sequential(reversed, async (seed: string) => {
    process.stdout.write(`processing ${seed} ... `)

    if (!seeds.slice().reverse().includes(seed)) {
      process.stdout.write('ERROR\n')
      throw new Error(`referenced applied seed ${seed} not found.`)
    }

    const tasks = await import(`${seedsPath}/${seed}`)
    const task = tasks.down
    task && await connection.query(task(sql, raw))
    await deleteSeed(seed, connection)
    process.stdout.write('DONE\n')
  })
}

const main = async (): Promise<void> => {
  const pool = createPool(uriString)
  const args = argsParser({ commands: ['up', 'down'] })
  const { command } = args
  const seeds = fs.readdirSync(seedsPath)

  if (seeds.length === 0) {
    process.stdout.write('no seeds found.')
    return
  }

  await pool.connect(async connection => {
    await initSeedsTable(connection)
    const applied = await getSeeds(connection)
    command === 'up' && await up(seeds, applied, connection)
    command === 'down' && await down(seeds, applied, connection)
  })
}

if (require.main === module) {
  main()
}
