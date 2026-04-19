import winston from "winston";

const logger = winston.createLogger({
     level: "info",
     format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
     ),
     defaultMeta: { service: "express-api" },
     transports: [
          new winston.transports.Console({
               format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
          }),
     ],
});

export default logger;
