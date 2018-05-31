import { Values } from "./types";

export interface Tracking {
  // Tracking specifies which kind of tokens (if any) tokens should be generated and returned
  // with the query results.
  type: TrackingType;

  // QueryID is a unique identifier for a single search query.  In the
  // case of live querying this is defined to be multiple individual queries
  // (i.e. as a user types the query is re-run).
  query_id: string;

  // Sequence (i.e. sequential identifier) of this  in the context of a
  // sequence of queries.
  sequence: number;

  // Field is a unique field on each result used to associate tracking information to the result.
  field: string;

  // Data are values which will be recorded along with tracking data produced
  // for the request.
  data: Values;
}

export interface Session {
  next(values: Values): [Tracking, undefined] | [undefined, Error];
  reset(): void;
}

export const TrackingNone: string = "";
export const TrackingClick: string = "CLICK";
export const TrackingPosNeg: string = "POS_NEG";

export const enum TrackingType {
  None = "",
  Click = "CLICK",
  PosNeg = "POS_NEG"
}

/**
 * TextSession creates a session based on text searches.
 * It resets once the value specified by the query label has changed in any of 3 ways:
 *
 * - Supplied as `undefined`.
 * - Any of the first 3 characters have changed as the result of an in place replacement (`aa` -> `ab`)
 * - Query length empty from previously non-empty.
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
 * BaseSession holds state about a series of searches.
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

// newQueryID constructs a new ID for a query.
const newQueryID = (): string => {
  let queryID = "";
  for (let i = 0; i < 16; i++) {
    queryID += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 36)
    );
  }
  return queryID;
};
