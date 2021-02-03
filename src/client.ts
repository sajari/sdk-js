import { pipeline, Pipeline } from "./pipeline";
import { isSSR } from "./ssr";

/**
 * Option is a function type which defines functions for setting config options
 * on a [[Client]].  See [[Client.constructor]] for more details.
 */
export type Option = (client: Client) => void;

/**
 * withEndpoint constructs an [[Option]] that sets the endpoint used by the client.
 */
export const withEndpoint = (endpoint: string) => (client: Client) => {
  client.endpoint = endpoint;
};

/**
 * @hidden
 */
const defaultEndpoint = `${isSSR() ? "https:" : ""}//jsonapi.sajari.net`;

/**
 * Client constructs a client for interacting with the Sajari API.
 */
export class Client {
  public project: string;
  public collection: string;
  public endpoint: string;

  /**
   * Constructs an instance of Client for a specific project and collection.
   *
   * ```javascript
   * const client = new Client("<project>", "<collection>");
   * const webPipeline = client.pipeline("website");
   * // webPipeline.search(...);
   * ```
   *
   * An optional array of [[Option]] may be given to the client constructor to
   * set config options.
   *
   * ```javascript
   * const client = new Client("<project>", "<collection>");
   * ```
   */
  public constructor(project: string, collection: string, opts: Option[] = []) {
    this.project = project;
    this.collection = collection;
    this.endpoint = defaultEndpoint;
    opts.forEach((opt) => {
      opt(this);
    });
  }

  /** pipeline returns a new [[Pipeline]] instance that inherits config from the Client. */
  public pipeline(name: string, version?: string): Pipeline {
    return new pipeline(this, name, version);
  }
}
