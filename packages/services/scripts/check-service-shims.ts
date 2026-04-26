import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const packageRoot = path.resolve(import.meta.dir, "..");
const workspaceRoot = path.resolve(packageRoot, "..", "..");
const sourceRoot = path.join(packageRoot, "src");
const runtimeRoot = path.join(workspaceRoot, "packages", "runtime");
const exportPattern = /^export \* from "([^"]+)";$/;

type Failure = {
  file: string;
  message: string;
};

function walkFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const absolutePath = path.join(root, entry);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      return walkFiles(absolutePath);
    }

    return absolutePath.endsWith(".ts") || absolutePath.endsWith(".tsx")
      ? [absolutePath]
      : [];
  });
}

function resolveLocalExport(fromFile: string, specifier: string) {
  const withoutJs = specifier.replace(/\.js$/, "");
  const basePath = path.resolve(path.dirname(fromFile), withoutJs);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function resolveRuntimeExport(specifier: string) {
  const relativePath = specifier.replace(/^@repo\/runtime\//, "");

  return path.join(runtimeRoot, relativePath);
}

const failures: Failure[] = [];

for (const file of walkFiles(sourceRoot)) {
  const relativeFile = path.relative(packageRoot, file).replace(/\\/g, "/");
  const content = readFileSync(file, "utf8").trim();
  const lines = content.split(/\r?\n/).filter(Boolean);

  if (lines.length === 0) {
    failures.push({ file: relativeFile, message: "empty shim file" });
    continue;
  }

  for (const line of lines) {
    const match = exportPattern.exec(line);

    if (!match) {
      failures.push({
        file: relativeFile,
        message: `unsupported shim statement: ${line}`,
      });
      continue;
    }

    const specifier = match[1];

    if (specifier.startsWith("@repo/runtime/")) {
      const target = resolveRuntimeExport(specifier);

      if (!existsSync(target)) {
        failures.push({
          file: relativeFile,
          message: `runtime target not found: ${specifier}`,
        });
      }

      continue;
    }

    if (specifier.startsWith(".")) {
      const target = resolveLocalExport(file, specifier);

      if (!target) {
        failures.push({
          file: relativeFile,
          message: `local target not found: ${specifier}`,
        });
      }

      continue;
    }

    failures.push({
      file: relativeFile,
      message: `unsupported export target: ${specifier}`,
    });
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`${failure.file}: ${failure.message}`);
  }

  process.exit(1);
}

console.log("services shim integrity ok");
