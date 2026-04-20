import Redis from "ioredis";
import logger from "./logger";

let redisConnection: Redis | null = null;

export function getRedisConnection(): Redis {
     if (redisConnection) return redisConnection;

     redisConnection = new Redis({
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379"),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
     });

     redisConnection.on("connect", () => {
          logger.info("Redis connection established");
     });

     redisConnection.on("error", (err) => {
          logger.error("Redis connection error", { error: err.message });
     });

     return redisConnection;
}

export function createNewRedisConnection(): Redis {
     return new Redis({
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379"),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
     });
}
