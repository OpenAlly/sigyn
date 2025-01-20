// Import Node.js Dependencies
import path from "node:path";
import url from "node:url";

// Import Third-party Dependencies
import { DockerComposeEnvironment } from "testcontainers";
import { GrafanaApi } from "@myunisoft/loki";

// Import Internal Dependencies
import { LogGenerator, type LogGeneratorOptions } from "./seeder/logs.js";
export { LogGenerator };

// CONSTANTS
const kDefaultOptions = {
  count: 500,
  labels: { app: "demo" }
};

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export async function run(options: LogGeneratorOptions = kDefaultOptions) {
  const environment = await new DockerComposeEnvironment(
    // "../" because we are in ./dist/ folder after TSC compilation
    path.join(__dirname, "../docker"),
    "docker-compose.yaml"
  ).up();
  const loki = environment.getContainer("loki");
  const lokiUrl = `http://${loki.getHost()}:${loki.getMappedPort(3100)}`;

  const api = new GrafanaApi({
    remoteApiURL: lokiUrl,
    apiToken: ""
  });

  const logGenerator = new LogGenerator(options);
  const logs = [...logGenerator.generate()];

  await api.Loki.push(logs);

  console.log("Logs ready on http://localhost:3000/explore");

  // keep process alive
  process.stdin.resume();

  process.once("exit", () => {
    environment.stop();
  });
}
