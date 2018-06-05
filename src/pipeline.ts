import { Client } from "./client";
import { processSearchResponse } from "./constructors";
import { request, RequestError } from "./lib/request";
import { Response } from "./results";
import { Session } from "./session";
import { Values } from "./types";

/** UserAgent to be sent along with requests identifying this sdk as the one making contact. */
const UserAgent = "sdk-js-1.0.0";

/**
 * Pipeline is a client for performing searches on a collection.
 *
 * Create a new Pipeline via [[Client.pipeline]].
 *
 * ```javascript
 * // const client = new Client(...);
 * const pipeline = client.pipeline("website");
 * ```
 *
 * From there we can perform searches on the pipeline.
 * We'll need [[Values]], an [[Session]], and a [[SearchCallback]].
 * See [[Pipeline.search]] for a more details.
 *
 * ```javascript
 * pipeline.search(values, session, callback);
 * ```
 */
export interface Pipeline {
  /**
   * Search runs a search query defined by a pipline with the given values and
   * session configuration. Calls the callback with the query results and returned values (which could have
   * been modified in the pipeline).
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
 * SearchCallback defines the callback supplied to a [[Pipeline.search]] that is called with
 * the error, results, and pipeline values from the search.
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
