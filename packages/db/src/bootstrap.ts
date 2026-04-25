import type { Database } from "bun:sqlite";

import { DOCUMENT_EMBEDDINGS_TABLE, EMBEDDING_DIMENSIONS } from "./schema";

export function ensureDatabaseSchema(sqlite: Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      owner TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Discovery',
      priority TEXT NOT NULL DEFAULT 'Medium',
      progress INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS projects_status_idx
      ON projects(status);

    CREATE INDEX IF NOT EXISTS projects_priority_idx
      ON projects(priority);

    CREATE TABLE IF NOT EXISTS project_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS project_documents_project_id_idx
      ON project_documents(project_id);

    CREATE INDEX IF NOT EXISTS project_documents_title_idx
      ON project_documents(title);

    CREATE VIRTUAL TABLE IF NOT EXISTS ${DOCUMENT_EMBEDDINGS_TABLE} USING vec0(
      document_id INTEGER PRIMARY KEY,
      project_id INTEGER PARTITION KEY,
      embedding FLOAT[${EMBEDDING_DIMENSIONS}],
      +content TEXT
    );
  `);
}

export function getSqliteVecVersion(sqlite: Database) {
  return (sqlite.query("SELECT vec_version() AS version").get() as {
    version: string;
  }).version;
}
