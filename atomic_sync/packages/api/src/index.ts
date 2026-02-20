import Fastify from "fastify";
import cors from "@fastify/cors";
import PgBoss from "pg-boss";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { feedRoutes } from "./routes/feeds.js";
import { healthRoutes } from "./routes/health.js";
import { setupWorkers } from "./workers/feed-sync.js";

declare module "fastify" {
  interface FastifyInstance {
    boss: PgBoss;
  }
}

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Start pgboss
  const boss = new PgBoss(config.databaseUrl);
  boss.on("error", (err) => app.log.error(err, "pgboss error"));
  await boss.start();
  await setupWorkers(boss);
  app.log.info("pgboss started");

  // Make boss available to routes
  app.decorate("boss", boss);

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(feedRoutes, { prefix: "/api" });

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info("shutting down...");
    await boss.stop();
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  await app.listen({ port: config.port, host: config.host });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
