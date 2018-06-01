import { Client } from "./client";
import { processSearchResponse } from "./constructors";
import { request, RequestError } from "./lib/request";
import { Results } from "./results";
import { Session } from "./session";
import { Values } from "./types";

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

export type SearchCallback = (
  error: RequestError | null,
  results?: Results,
  values?: Values
) => void;

export class PipelineImpl implements Pipeline {
  private client: Client;
  private name: string;
  private endpoint: string = "sajari.api.pipeline.v1.Query/Search";

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
      const e = new Error("could not get next session: " + error);
      e.name = "SessionError";
      callback(e);
      return;
    }

    const requestBody = JSON.stringify({
      // tslint:disable:object-literal-sort-keys
      metadata: {
        project: [this.client.project],
        collection: [this.client.collection],
        "user-agent": [UserAgent]
      },
      // tslint:enable:object-literal-sort-keys
      request: {
        tracking,
        values,
        pipeline: { name: this.name }
      }
    });

    request(
      `${this.client.endpoint}/${this.endpoint}`,
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
