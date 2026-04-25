#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const cypressPackageJson = require.resolve("cypress/package.json");
const cypressBin = path.join(path.dirname(cypressPackageJson), "bin", "cypress");

const result = spawnSync(process.execPath, [cypressBin, ...process.argv.slice(2)], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
