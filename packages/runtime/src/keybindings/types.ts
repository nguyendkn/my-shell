export type KeybindingContextName = string;
export type KeybindingAction = string;
export type ParsedKeystroke = {
  key?: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  super?: boolean;
};
export type ParsedBinding = {
  // Action invoked when the chord matches. May be `null` to explicitly
  // unbind a default mapping (resolver returns {type: "unbound"} on match).
  action: string | null;
  // The parsed keystroke sequence (single keystroke for non-chord bindings,
  // multiple for sequential chord bindings like ctrl+x ctrl+s). Readonly
  // because parseChord returns Chord (= readonly ParsedKeystroke[]).
  chord: readonly ParsedKeystroke[];
  // The context this binding applies in (Global, Repl, etc.). Resolver
  // filters bindings by activeContexts before matching.
  context: KeybindingContextName;
};
// Bindings are written as a key-string → action map (e.g. {"ctrl+r": "history:search"});
// the parser later expands each entry into a ParsedBinding.
export type KeybindingMap = Record<string, KeybindingAction>;
export type KeybindingBlock = {
  context?: KeybindingContextName;
  bindings?: KeybindingMap;
};

export type Chord = readonly ParsedKeystroke[];
