import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as sqliteVec from "sqlite-vec";

import * as schema from "./schema";
import { getDatabasePath, type DatabasePathOptions } from "./path";

export type CreateDatabaseOptions = DatabasePathOptions | string;
export type DatabaseHandle = ReturnType<typeof createDatabase>;

let handle: DatabaseHandle | undefined;

function ensureDatabaseDirectory(databasePath: string) {
  if (!databasePath || databasePath === ":memory:") {
    return;
  }

  const directory = dirname(
    databasePath.startsWith("file:") ? databasePath.slice(5) : databasePath,
  );

  if (directory !== ".") {
    mkdirSync(directory, { recursive: true });
  }
}

function resolveDatabasePath(options: CreateDatabaseOptions = {}) {
  if (typeof options === "string") {
    return options;
  }

  return getDatabasePath(options);
}

export function createDatabase(options: CreateDatabaseOptions = {}) {
  const databasePath = resolveDatabasePath(options);

  ensureDatabaseDirectory(databasePath);

  const sqlite = new Database(databasePath, {
    create: true,
    readwrite: true,
    strict: true,
  });

  sqlite.run("PRAGMA foreign_keys = ON");
  sqlite.run("PRAGMA journal_mode = WAL");
  sqlite.run("PRAGMA synchronous = NORMAL");
  sqliteVec.load(sqlite);

  const db = drizzle({
    client: sqlite,
    schema,
  });

  return {
    db,
    path: databasePath,
    sqlite,
  };
}

export function getDatabase(options: CreateDatabaseOptions = {}) {
  handle ??= createDatabase(options);

  return handle;
}

export function closeDatabase() {
  handle?.sqlite.close(false);
  handle = undefined;
}
