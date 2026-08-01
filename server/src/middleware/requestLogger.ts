import { NextFunction, Request, Response } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    const message = `[HTTP] ${logEntry.method} ${logEntry.path} -> ${logEntry.status} (${logEntry.durationMs}ms)`;

    if (res.statusCode >= 500) {
      console.error(message, logEntry);
      return;
    }

    if (res.statusCode >= 400) {
      console.warn(message, logEntry);
      return;
    }

    console.log(message, logEntry);
  });

  next();
};
