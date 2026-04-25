// Raw cell shape parsed from a .ipynb file. Loosely typed at the wire
// boundary; processCell narrows to the structured forms below.
export type NotebookCell = {
  cell_type?: "code" | "markdown" | "raw" | string;
  source?: string | string[];
  outputs?: NotebookCellOutput[];
  id?: string;
  execution_count?: number | null;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

// One output from a code cell (stream / display_data / execute_result /
// error). Mirrors the nbformat schema; fields are optional because each
// output_type populates a different subset.
export type NotebookCellOutput = {
  output_type?: string;
  text?: string;
  data?: Record<string, unknown>;
  name?: string;
  ename?: string;
  evalue?: string;
  traceback?: string[];
  execution_count?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

// Inline image extracted from a NotebookCellOutput's data field. media_type
// is the MIME type the kernel emitted; common values are listed but the
// string union stays open to accommodate vendor-specific image MIMEs.
export type NotebookOutputImage = {
  image_data: string;
  media_type: string;
};

// Processed/normalized output the runtime stores after readNotebook.
export type NotebookCellSourceOutput = {
  output_type: string;
  text?: string;
  image?: NotebookOutputImage;
};

// Processed/normalized cell shape produced by processCell — what the rest of
// the runtime (tool prompts, NotebookEdit, etc.) consumes. cellType /
// language / source are populated from the raw NotebookCell which carries
// `unknown`-typed fields, so they're loosely typed here and narrowed
// further at consumer sites that need string operations.
export type NotebookCellSource = {
  cell_id: string;
  cell_type?: NotebookCell["cell_type"];
  cellType?: string;
  language?: string;
  source?: string | string[] | unknown;
  outputs?: NotebookCellSourceOutput[];
  execution_count?: number | null | undefined;
};

export type NotebookContent = {
  readonly cells: readonly NotebookCell[];
  readonly metadata: {
    language_info?: { name?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
  readonly nbformat?: number;
  readonly nbformat_minor?: number;
};
