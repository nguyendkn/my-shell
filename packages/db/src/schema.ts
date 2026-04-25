import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const EMBEDDING_DIMENSIONS = 1536;
export const DOCUMENT_EMBEDDINGS_TABLE = "document_embeddings";

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    owner: text("owner").notNull(),
    status: text("status", {
      enum: ["Discovery", "Active", "Review", "Paused"],
    })
      .notNull()
      .default("Discovery"),
    priority: text("priority", {
      enum: ["Low", "Medium", "High"],
    })
      .notNull()
      .default("Medium"),
    progress: integer("progress").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("projects_status_idx").on(table.status),
    index("projects_priority_idx").on(table.priority),
  ],
);

export const projectDocuments = sqliteTable(
  "project_documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    metadata: text("metadata", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("project_documents_project_id_idx").on(table.projectId),
    index("project_documents_title_idx").on(table.title),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectDocument = typeof projectDocuments.$inferSelect;
export type NewProjectDocument = typeof projectDocuments.$inferInsert;
