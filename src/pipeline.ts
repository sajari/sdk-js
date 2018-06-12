import { Client } from "./client";
import { processSearchResponse } from "./constructors";
import { request, RequestError } from "./lib/request";
import { Response } from "./results";
import { Session } from "./session";
import { Values } from "./types";

/**
 * @hidden
 */
const UserAgent = "sdk-js-1.0.0";

/**
 * Pipeline is a client for running query pipelines on a collection.  See
 * [[Pipeline.search]] for more details.
 *
 * Create a new Pipeline via [[Client.pipeline]].
 *
 * ```javascript
 * // const client = new Client(...);
 * const pipeline = client.pipeline("website");
 * ```
 */
export interface Pipeline {
  /**
   * Search runs a search query defined by a pipeline with the given values and
   * session configuration. The callback is executed with the query results and
   * any values that have been modified/created by the pipeline.  If an error
   * occurs this will be passed to the callback as a [[RequestError]].
   *
   * ```javascript
   * pipeline.search({ q: "<search query>" }, session, (error, results, values) => {
   *   if (error) {
   *     console.error(error);
   *     return;
   *   }
   *   console.log(results, values);
   * });
   * ```
   */
  search(values: Values, session: Session, callback: SearchCallback): void;
}

/**
 * SearchCallback defines the callback supplied to a [[Pipeline.search]]. See [[Pipeline.search]]
 * for more details.
 */
export type SearchCallback = (
  error: RequestError | null,
  response?: Response,
  values?: Values
) => void;

/**
 * Internal implementation of [[Pipeline]]
 * @hidden
 */
// tslint:disable-next-line:class-name
export class pipeline implements Pipeline {
  public static readonly searchEndpoint = "sajari.api.pipeline.v1.Query/Search";

  private client: Client;
  private name: string;

  public constructor(client: Client, name: string) {
    this.client = client;
    this.name = name;
  }

  public search(
    values: Values,
    session: Session,
    callback: SearchCallback
  ): void {
    const [tracking, error] = session.next(values);
    if (error) {
      const e = new Error("could not get next tracking data: " + error);
      e.name = "SessionError";

      callback(e);
      return;
    }

    const requestBody = JSON.stringify({
      metadata: {
        collection: [this.client.collection],
        project: [this.client.project],
        "user-agent": [UserAgent]
      },
      request: {
        tracking,
        values,
        pipeline: { name: this.name }
      }
    });

    request(
      `${this.client.endpoint}/${pipeline.searchEndpoint}`,
      requestBody,
      (err: RequestError | null, response?: any) => {
        if (err) {
          callback(err);
          return;
        }
        callback(
          null,
          processSearchResponse(response.searchResponse, response.tokens),
          response.values
        );
      }
    );
  }
}
