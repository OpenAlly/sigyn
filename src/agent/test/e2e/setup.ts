// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import { DockerComposeEnvironment } from "testcontainers";
import { MockAgent, setGlobalDispatcher } from "@myunisoft/httpie";
import Fastify from "fastify";
import { GrafanaApi } from "@myunisoft/loki";

// CONSTANTS
const kMockAgent = new MockAgent();
const kDefaultGrafanaHost = "http://localhost:3000";

export const LOG_MESSAGE = "Hello World";

export interface SetupEnvironmentOptions {
  grafanaHost?: string
}

export async function setupEnvironment(options: SetupEnvironmentOptions = {}) {
  const { grafanaHost = kDefaultGrafanaHost } = options;

  setGlobalDispatcher(kMockAgent);
  const environment = await new DockerComposeEnvironment(
    path.join(__dirname, "./docker"),
    "docker-compose.yaml"
  ).up();
  const loki = environment.getContainer("loki");

  const pool = kMockAgent.get(grafanaHost);
  pool.intercept({
    path: () => true
  }).reply(
    200,
    [{ type: "loki", uid: "uid", orgId: 1 }],
    {
      headers: {
        "content-type": "application/json"
      }
    }
  ).persist();

  const server = Fastify({
    logger: {
      transport: {
        target: "pino-loki",
        options: {
          batching: false,
          labels: { app: "fastify" },
          host: `http://${loki.getHost()}:${loki.getMappedPort(3100)}`
        }
      }
    }
  });
  server.get("/logging", async(req) => {
    req.log.info(LOG_MESSAGE);

    return { hello: "world" };
  });
  server.get("/api/datasources", async() => [{ type: "loki", uid: "uid", orgId: 1 }]);

  const lokiApi = new GrafanaApi({
    remoteApiURL: `http://${loki.getHost()}:${loki.getMappedPort(3100)}`
  });

  async function fetchLoggingEndpoint() {
    await server.inject({
      method: "GET",
      url: "/logging"
    });
  }

  await server.listen({ port: 3030 });

  return { lokiApi, server, fetchLoggingEndpoint };
}
