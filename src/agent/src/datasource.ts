// Import Third-party Dependencies
import { GrafanaApi } from "@myunisoft/loki";

export class Datasource {
  #lokiApi: GrafanaApi;

  private static datasource: Datasource;

  private constructor(host: string) {
    this.#lokiApi = new GrafanaApi({
      remoteApiURL: host
    });
  }

  fetchDatasources() {
    return this.#lokiApi.Datasources.all();
  }

  static async Loki(host: string) {
    this.datasource ??= new Datasource(host);

    const datasources = await this.datasource.fetchDatasources();

    return datasources.find((datasource) => datasource.type === "loki")!;
  }
}
