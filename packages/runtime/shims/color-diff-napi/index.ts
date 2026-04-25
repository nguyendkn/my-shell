// Re-export qua workspace subpath export — thay relative 5 `..` (chỉ resolve
// từ source location, không từ bun cache) bằng `@repo/runtime/src/...`. Tool
// nào cũng resolve được: TS/bundler/LSP đều biết workspace.
export {
  ColorDiff,
  ColorFile,
  getSyntaxTheme,
  getNativeModule,
} from "@repo/runtime/src/native-ts/color-diff/index.ts";
export type {
  ColorDiffClass,
  ColorFileClass,
  Hunk,
  SyntaxTheme,
} from "@repo/runtime/src/native-ts/color-diff/index.ts";
