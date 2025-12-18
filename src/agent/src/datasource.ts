// Import Third-party Dependencies
import {
  GrafanaApi,
  type Datasource as GrafanaDatasource
} from "@myunisoft/loki";

export class Datasource {
  #grafanaApi: GrafanaApi;

  private static datasource: Datasource;
  private static cache: GrafanaDatasource;

  private constructor(host: string) {
    this.#grafanaApi = new GrafanaApi({
      remoteApiURL: host
    });
  }

  fetchDatasources() {
    return this.#grafanaApi.Datasources.all();
  }

  static async Loki(host: string) {
    if (this.cache !== undefined) {
      return this.cache;
    }

    this.datasource ??= new Datasource(host);

    const datasources = await this.datasource.fetchDatasources();
    const lokiDatasources = datasources.filter((datasource) => datasource.type === "loki")!;
    const datasource = lokiDatasources.find((lokiDatasource) => lokiDatasource.isDefault) ?? lokiDatasources.at(0)!;
    this.cache = datasource;

    return datasource;
  }
}
