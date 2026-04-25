import { closeDatabase, getDatabase } from "./client";
import { ensureDatabaseSchema, getSqliteVecVersion } from "./bootstrap";

const { path, sqlite } = getDatabase();

ensureDatabaseSchema(sqlite);

console.log(`SQLite database ready: ${path}`);
console.log(`sqlite-vec ready: ${getSqliteVecVersion(sqlite)}`);

closeDatabase();
