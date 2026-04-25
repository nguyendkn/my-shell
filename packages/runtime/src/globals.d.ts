declare const MACRO: {
  VERSION: string;
  BUILD_TIME: string;
  PACKAGE_URL: string;
  NATIVE_PACKAGE_URL: string;
  VERSION_CHANGELOG: string;
  ISSUES_EXPLAINER: string;
  FEEDBACK_CHANNEL: string;
};

// Optional/peer dependencies that may not be installed in every build.
// Loaded via dynamic import behind feature gates; declared as `any` so
// the type checker doesn't complain when the package isn't resolvable.
declare module "@anthropic-ai/bedrock-sdk";
declare module "@anthropic-ai/foundry-sdk";
declare module "@anthropic-ai/vertex-sdk";
declare module "@aws-sdk/client-bedrock";
declare module "@aws-sdk/client-sts";
declare module "@aws-sdk/credential-provider-node";
declare module "@aws-sdk/credential-providers";
declare module "@azure/identity";
declare module "@opentelemetry/exporter-logs-otlp-grpc";
declare module "@opentelemetry/exporter-logs-otlp-http";
declare module "@opentelemetry/exporter-logs-otlp-proto";
declare module "@opentelemetry/exporter-metrics-otlp-grpc";
declare module "@opentelemetry/exporter-metrics-otlp-http";
declare module "@opentelemetry/exporter-metrics-otlp-proto";
declare module "@opentelemetry/exporter-prometheus";
declare module "@opentelemetry/exporter-trace-otlp-grpc";
declare module "@opentelemetry/exporter-trace-otlp-http";
declare module "@opentelemetry/exporter-trace-otlp-proto";
declare module "@smithy/core";
declare module "@smithy/node-http-handler";
declare module "audio-capture-napi";
declare module "cacache";
declare module "cli-highlight";
declare module "fflate";
declare module "image-processor-napi";
declare module "plist";
declare module "sharp";
declare module "turndown";

// Bun loader for markdown — returns the file contents as a string.
declare module "*.md" {
  const content: string;
  export default content;
}
