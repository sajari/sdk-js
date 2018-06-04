import { pipeline, Pipeline } from "./pipeline";

/** ClientOption defines a function which modifies a [[Client]] during its construction.*/
export type ClientOption = (client: Client) => void;

/** withEndpoint constructs a [[ClientOption]] that modifies the endpoint used by the client.*/
export const withEndpoint = (endpoint: string) => (client: Client) => {
  client.endpoint = endpoint;
};

/**
 * Client takes configuration and constructs pipelines clients.
 */
export class Client {
  public project: string;
  public collection: string;
  public endpoint: string;

  /**
   * Constructs an instance of Client using the project and collection from your Sajari accouint.
   * You can find your project and collection in the Sajari console https://www.sajari.com/console/.
   *
   * ```javascript
   * const client = new Client("<project>", "<collection>");
   * const webPipeline = client.pipeline("website");
   * // webPipeline.search(...);
   * ```
   *
   * An optional array of [[ClientOption]] may be given to the client constructor to modify its behaviour.
   *
   * ```javascript
   * const client = new Client("<project>", "<collection>", withEndpoint("https://example.com"));
   * ```
   */
  public constructor(
    project: string,
    collection: string,
    opts: ClientOption[] = []
  ) {
    this.project = project;
    this.collection = collection;
    this.endpoint = "https://jsonapi.sajari.net";
    opts.forEach(opt => {
      opt(this);
    });
  }

  /** pipeline returns a new [[Pipeline]] instance using this client for configuration. */
  public pipeline(name: string): Pipeline {
    return new pipeline(this, name);
  }
}
