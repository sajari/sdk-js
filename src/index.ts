/**
 * @fileOverview Exports the Sajari javascript api.
 * @name index.ts
 * @author Sajari
 * @license MIT
 * @module sajari
 */

import {
  newRequest,
  newAggregates,
  newQueryID,
  newResult,
  newResults,
  valueFromProto
} from "./constructors";
import { newError, SearchError } from "./error";
import { AggregateResponse, Result, Results, ResultValues } from "./results";

const UserAgent = "sdk-js-1.0.0";

export interface Tracking {
  // Tracking specifies which kind (if any) tokens should be generated and returned
  // with the query results.
  type: TrackingType;

  // QueryID is a unique identifier for a single search query.  In the
  // case of live querying this is defined to be multiple individual queries
  // (i.e. as a user types the query is re-run).
  query_id: string;

  // Sequence (i.e. sequential identifier) of this  in the context of a
  // sequence of queries.
  sequence: number;

  // Field is the field to be used for adding identifier information to
  // generated tokens (see TrackingType).
  field: string;

  // Data are values which will be recorded along with tracking data produced
  // for the request.
  data: Values;
}

/**
 * Values is a plan object with only string values.
 */
export interface Values {
  [id: string]: string;
}

export interface Session {
  next(values: Values): [Tracking, undefined] | [undefined, Error];
  reset(): void;
}

export const TrackingNone: string = "NONE";
export const TrackingClick: string = "CLICK";
export const TrackingPosNeg: string = "POS_NEG";

export const enum TrackingType {
  TrackingNone = "NONE",
  TrackingClick = "CLICK",
  TrackingPosNeg = "POS_NEG"
}

/**
 * TextSession creates a session based on text searches.
 * It automatically resets once the value specified by the query label has changed in certain ways.
 */
export class TextSession implements Session {
  private queryLabel: string;
  private session: Session;
  private lastQuery: string = "";

  public constructor(queryLabel: string, session: Session) {
    this.queryLabel = queryLabel;
    this.session = session;
  }

  public next(values: Values): [Tracking, undefined] | [undefined, Error] {
    const text = values[this.queryLabel];
    if (text === undefined) {
      this.reset();
      return this.session.next(values);
    }

    const shortenedPrevQ = this.lastQuery.substr(0, Math.min(text.length, 3));
    const first3CharactersChanged = !(
      text.substr(0, shortenedPrevQ.length) === shortenedPrevQ
    );
    const queryCleared = this.lastQuery.length > 0 && text.length === 0;
    if (first3CharactersChanged || queryCleared) {
      this.reset();
    }
    this.lastQuery = text;

    return this.session.next(values);
  }

  public reset(): void {
    this.session.reset();
  }
}

/**
 * Session holds state about a series of searches.
 */
export class BaseSession implements Session {
  private queryID: string = "";
  private sequence: number = 0;

  private trackingType: TrackingType;
  private field: string;
  private sessionData: Values;

  public constructor(trackingType: TrackingType, field: string, data: Values) {
    this.trackingType = trackingType;
    this.field = field;
    this.sessionData = data;
  }

  public next(values: Values): [Tracking, undefined] | [undefined, Error] {
    if (this.queryID === "") {
      this.queryID = newQueryID();
      this.sequence = 0;
    } else {
      this.sequence++;
    }

    return [
      {
        type: this.trackingType,
        query_id: this.queryID,
        sequence: this.sequence,
        field: this.field,
        data: this.sessionData
      } as Tracking,
      undefined
    ];
  }

  public reset(): void {
    this.queryID = "";
    this.sequence = 0;
  }
}

export type ClientOption = (client: Client) => void;

/**
 * withEndpoint constructs a [[ClientOption]] that modifies the endpoint used by the client.
 */
export const withEndpoint = (endpoint: string) => (client: Client) => {
  client.endpoint = endpoint;
};

/**
 * Client takes configuration and constructs pipelines clients.
 *
 * ```javascript
 * const client = new Client("<project>", "<collection>");
 * const webPipeline = client.pipeline("website");
 * // webPipeline.search(...);
 * ```
 *
 * An optional array of [[ClientOption]] may be given to the client constructor to modify it's behaviour.
 *
 * ```javascript
 * const client = new Client("<project>", "<collection>", withEndpoint("https://example.com"));
 * ```
 */
export class Client {
  public project: string;
  public collection: string;
  public endpoint: string;

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

  /**
   * pipeline returns a new [[Pipeline]].
   */
  public pipeline(name: string): Pipeline {
    return new PipelineImpl(this, name);
  }
}

export interface Key {
  field: string;
  value: any;
}

export type SearchCallback = (
  error: SearchError | undefined,
  results: Results | undefined,
  values: Values | undefined
) => void;

export type AddCallback = (key: Key, error: SearchError) => void;

export interface SJRecord {
  [id: string]: any;
}

/**
 * PipelineImpl is private to prevent users constructing it themselves.
 */
class PipelineImpl {
  public client: Client;
  public name: string;
  public endpoint: string = "sajari.api.pipeline.v1.Query/Search";

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
      callback(
        newError("error getting next session: " + error),
        undefined,
        undefined
      );
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

    newRequest(
      `${this.client.endpoint}/${this.endpoint}`,
      requestBody,
      (err?: SearchError, response?: any) => {
        if (err !== undefined) {
          callback(err, undefined, undefined);
          return;
        }
        callback(
          undefined,
          newResults(response.searchResponse, response.tokens),
          response.values
        );
      }
    );
  }
}

/**
 * Pipeline is a client for performing searches and adds on a collection.
 *
 * Create a Pipeline cia [[Client.pipeline]].
 *
 * ```javascript
 * // const client = new Client(...);
 * const pipeline = client.pipeline("website");
 * ```
 *
 * From there we can perform searches on the pipeline.
 * We'll need [[Values]], an [[ISession]], and a [[SearchCallback]].
 * See [[Pipeline.search]] for a more detailed answer.
 *
 * ```javascript
 * pipeline.search(values, session, callback);
 * ```
 */
export interface Pipeline {
  client: Client;
  name: string;
  endpoint: string;

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
  search(
    values: Values,
    session: ISession,
    callback: SearchCallback
  ): void;
}
