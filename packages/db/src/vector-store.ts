import type { Database } from "bun:sqlite";

import { ensureDatabaseSchema } from "./bootstrap";
import { DOCUMENT_EMBEDDINGS_TABLE, EMBEDDING_DIMENSIONS } from "./schema";

export type DocumentEmbeddingInput = {
  content?: string;
  documentId: number;
  embedding: readonly number[];
  projectId: number;
};

export type DocumentEmbeddingSearchResult = {
  content: string | null;
  distance: number;
  documentId: number;
  projectId: number;
};

export type DocumentEmbeddingSearchOptions = {
  embedding: readonly number[];
  k?: number;
  projectId?: number;
};

function serializeEmbedding(embedding: readonly number[]) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected embedding with ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}.`,
    );
  }

  return JSON.stringify(embedding);
}

export function upsertDocumentEmbedding(
  sqlite: Database,
  input: DocumentEmbeddingInput,
) {
  ensureDatabaseSchema(sqlite);

  const embedding = serializeEmbedding(input.embedding);

  sqlite.transaction((record: DocumentEmbeddingInput) => {
    sqlite
      .query(`DELETE FROM ${DOCUMENT_EMBEDDINGS_TABLE} WHERE document_id = ?`)
      .run(record.documentId);

    sqlite
      .query(
        `
        INSERT INTO ${DOCUMENT_EMBEDDINGS_TABLE}
          (document_id, project_id, embedding, content)
        VALUES (?, ?, ?, ?)
      `,
      )
      .run(record.documentId, record.projectId, embedding, record.content ?? null);
  })(input);
}

export function searchDocumentEmbeddings(
  sqlite: Database,
  options: DocumentEmbeddingSearchOptions,
) {
  ensureDatabaseSchema(sqlite);

  const k = options.k ?? 10;
  const embedding = serializeEmbedding(options.embedding);

  const rows =
    typeof options.projectId === "number"
      ? sqlite
          .query(
            `
            SELECT
              document_id AS documentId,
              project_id AS projectId,
              content,
              distance
            FROM ${DOCUMENT_EMBEDDINGS_TABLE}
            WHERE embedding MATCH ?
              AND k = ?
              AND project_id = ?
            ORDER BY distance
          `,
          )
          .all(embedding, k, options.projectId)
      : sqlite
          .query(
            `
            SELECT
              document_id AS documentId,
              project_id AS projectId,
              content,
              distance
            FROM ${DOCUMENT_EMBEDDINGS_TABLE}
            WHERE embedding MATCH ?
              AND k = ?
            ORDER BY distance
          `,
          )
          .all(embedding, k);

  return rows as DocumentEmbeddingSearchResult[];
}
