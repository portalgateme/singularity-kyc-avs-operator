import winston from "winston";

const loggerOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "avs-kyc-operator" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(
          ({ level, message, timestamp, service, context, stack, ...meta }) => {
            let log = `${timestamp} [${service}${
              context ? "/" + context : ""
            }] ${level}: ${message}`;
            const metaString = JSON.stringify(meta, null, 2);
            if (metaString !== "{}") {
              log += ` \n${metaString}`;
            }
            if (stack) {
              log += `\n${stack}`;
            }
            return log;
          }
        )
      ),
    }),
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            format: winston.format.json(),
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
            format: winston.format.json(),
          }),
        ]
      : []),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
};

winston.loggers.add("default", loggerOptions);

const baseLogger = winston.loggers.get("default");

/**
 * Get a logger instance with a specific context.
 * Uses a child logger to automatically add the context to log entries.
 * @param context - The context for this logger (e.g., class or module name).
 * @returns A configured winston logger with the specified context.
 */
export function getLogger(context: string): winston.Logger {
  return baseLogger.child({ context });
}

export const defaultLogger = baseLogger;
