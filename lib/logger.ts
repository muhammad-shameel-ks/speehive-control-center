type Level = "debug" | "info" | "warn" | "error";

const IS_PROD = process.env.NODE_ENV === "production";

function emit(level: Level, prefix: string, args: unknown[]) {
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  fn(`[${prefix}]`, ...args);
}

function createLogger(prefix: string) {
  return {
    debug: (...args: unknown[]) => {
      if (!IS_PROD) emit("debug", prefix, args);
    },
    info: (...args: unknown[]) => {
      if (!IS_PROD) emit("info", prefix, args);
    },
    warn: (...args: unknown[]) => emit("warn", prefix, args),
    error: (...args: unknown[]) => emit("error", prefix, args),
  };
}

export const log = {
  asana: createLogger("asana"),
  security: createLogger("SECURITY"),
  auth: createLogger("asana:auth"),
  tasks: createLogger("asana:tasks"),
  rateLimit: createLogger("rate_limit"),
  summary: createLogger("summary"),
};
