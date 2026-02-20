import crypto from "node:crypto";
import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { connections, oauthStates } from "../db/schema.js";
import { config } from "../config.js";

// PKCE helpers
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function generateState(): string {
  return crypto.randomBytes(16).toString("base64url");
}

export async function authRoutes(app: FastifyInstance) {
  // Start OAuth flow: user provides their atomic instance URL
  app.post<{ Body: { atomicUrl: string } }>(
    "/auth/connect",
    async (request, reply) => {
      const { atomicUrl } = request.body;
      const baseUrl = atomicUrl.replace(/\/$/, "");

      // Step 1: Dynamic client registration
      const registerRes = await fetch(`${baseUrl}/oauth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Atomic Sync",
          redirect_uris: [`${config.publicUrl}/api/auth/callback`],
          grant_types: ["authorization_code"],
          response_types: ["code"],
          token_endpoint_auth_method: "client_secret_post",
        }),
      });

      if (!registerRes.ok) {
        const text = await registerRes.text();
        return reply.status(400).send({
          error: `Failed to register with atomic instance: ${text}`,
        });
      }

      const client = (await registerRes.json()) as {
        client_id: string;
        client_secret: string;
      };

      // Step 2: Build authorization URL with PKCE
      const state = generateState();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      // Persist state for the callback
      await db.insert(oauthStates).values({
        state,
        atomicUrl: baseUrl,
        clientId: client.client_id,
        clientSecret: client.client_secret,
        codeVerifier,
      });

      const params = new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: `${config.publicUrl}/api/auth/callback`,
        response_type: "code",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
      });

      return { authUrl: `${baseUrl}/oauth/authorize?${params}` };
    },
  );

  // OAuth callback: exchange code for token
  app.get<{ Querystring: { code: string; state: string } }>(
    "/auth/callback",
    async (request, reply) => {
      const { code, state } = request.query;

      if (!code || !state) {
        return reply.status(400).send({ error: "Missing code or state" });
      }

      // Look up the pending OAuth flow
      const [oauthState] = await db
        .select()
        .from(oauthStates)
        .where(eq(oauthStates.state, state));

      if (!oauthState) {
        return reply.status(400).send({ error: "Invalid or expired state" });
      }

      // Exchange code for token
      const tokenRes = await fetch(`${oauthState.atomicUrl}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: oauthState.clientId,
          client_secret: oauthState.clientSecret,
          code_verifier: oauthState.codeVerifier,
          redirect_uri: `${config.publicUrl}/api/auth/callback`,
        }),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        // Clean up state
        await db.delete(oauthStates).where(eq(oauthStates.state, state));
        return reply.status(400).send({
          error: `Token exchange failed: ${text}`,
        });
      }

      const token = (await tokenRes.json()) as { access_token: string };

      // Save the connection
      const [connection] = await db
        .insert(connections)
        .values({
          atomicUrl: oauthState.atomicUrl,
          accessToken: token.access_token,
          oauthClientId: oauthState.clientId,
          oauthClientSecret: oauthState.clientSecret,
        })
        .returning();

      // Clean up state
      await db.delete(oauthStates).where(eq(oauthStates.state, state));

      // Redirect to frontend with the new connection ID
      return reply.redirect(
        `${config.publicUrl}/connections/${connection.id}`,
      );
    },
  );

  // List connections
  app.get("/auth/connections", async () => {
    const rows = await db
      .select({
        id: connections.id,
        atomicUrl: connections.atomicUrl,
        createdAt: connections.createdAt,
      })
      .from(connections);

    return rows;
  });

  // Delete a connection (and cascades to feeds + sync records)
  app.delete<{ Params: { id: string } }>(
    "/auth/connections/:id",
    async (request, reply) => {
      const { id } = request.params;
      const deleted = await db
        .delete(connections)
        .where(eq(connections.id, id))
        .returning();

      if (deleted.length === 0) {
        return reply.status(404).send({ error: "Connection not found" });
      }

      return { ok: true };
    },
  );
}
