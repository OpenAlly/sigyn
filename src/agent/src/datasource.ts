// Import Third-party Dependencies
import { GrafanaLoki } from "@myunisoft/loki";

export class Datasource {
  #lokiApi: GrafanaLoki;

  private static datasource: Datasource;

  private constructor(host: string) {
    this.#lokiApi = new GrafanaLoki({
      remoteApiURL: host
    });
  }

  fetchDatasources() {
    return this.#lokiApi.datasources();
  }

  static async Loki(host: string) {
    this.datasource ??= new Datasource(host);

    const datasources = await this.datasource.fetchDatasources();

    return datasources.find((datasource) => datasource.type === "loki")!;
  }
}
