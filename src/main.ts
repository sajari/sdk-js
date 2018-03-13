/**
 * @fileOverview Exports the Sajari javascript api.
 * @name main.ts
 * @author Sajari
 * @license MIT
 * @module sajari
 */

export interface Tracking {
	// Tracking specifies which kind (if any) tokens should be generated and returned
	// with the query results.
	type: TrackingType;

	// QueryID is a unique identifier for a single search query.  In the
	// case of live querying this is defined to be multiple individual queries
	// (i.e. as a user types the query is re-run).
	queryID: string;

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

export interface Values {
  [id: string]: string;
}

export interface Session {
  next(values: Values): [Tracking | undefined, Error | undefined];
  reset(): void;
}

export const TrackingNone: string = "";
export const TrackingClick: string = "CLICK";
export const TrackingPosNeg: string = "POS_NEG";

export const enum TrackingType {
  TrackingNone = "",
  TrackingClick = "CLICK",
  TrackingPosNeg = "POS_NEG",
}

// randString constructs a random string of 16 characters.
const randString = (): string => {
  let queryID = ""
  for (let i = 0; i < 16; i++) {
    queryID += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 36)
    );
  }
  return queryID;
}

export class WebSearchSession implements Session {
  private queryLabel: string;
  private session: Session;
  private lastQuery: string = "";

  public constructor(queryLabel: string, session: Session) {
    this.queryLabel = queryLabel;
    this.session = session;
  }
  
  public next(values: Values): [Tracking | undefined, Error | undefined] {
    const text = values[this.queryLabel];
    if (text === undefined) {
      this.reset();
      return this.session.next(values);
    }
    
    if (text !== this.lastQuery) {
        this.reset();
    }

    return this.session.next(values);
  }
  
  public reset(): void {
    this.session.reset();
  }
}

export class SessionType implements Session {
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

  public next(): [Tracking | undefined, Error | undefined] {
    if (this.queryID === "") {
      this.queryID = randString();
      this.sequence = 0;
    } else {
      this.sequence++;
    }

    return [{
      type: this.trackingType,
      queryID: this.queryID,
      sequence: this.sequence,
      field: this.field,
      data: this.sessionData
    }, undefined];
  }

  public reset(): void {
    this.queryID = "";
    this.sequence = 0;
  }
}

export class Client {
  public project: string;
  public collection: string;
  public endpoint: string;

  public constructor(project: string, collection: string) {
    this.project = project;
    this.collection = collection;
    this.endpoint = "";
  }

  public pipeline(name: string): Pipeline {
    return new Pipeline(this, name);
  }
}

export interface ResultValues {
  [id: string]: any;
}

export interface TokenValues {
  [id: string]: any;
}

export interface Result {
  // Values are field values of records.
	values: ResultValues;

	// Tokens contains any tokens associated with this Result.
	tokens: TokenValues;

	// Score is the overall score of this Result.
	score: number;

	// IndexScore is the index-matched score of this Result.
	indexScore: number;
}

export interface AggregateValues {
  [id: string]: any;
}

export interface Results {
  // Reads is the total number of index values read.
	reads: number;

	// TotalResults is the total number of results for the query.
	totalResults: number;

	// Time taken to perform the query.
	time: string;

	// Aggregates computed on the query results (see Aggregate).
	aggregates: AggregateValues;

	// Results of the query.
	results: Result[];
}

export interface Key {
	field: string;
	value: any;
}

export type SearchCallback = (results: Results, values: Values, error: Error ) => void;

export type AddCallback = (key: Key, error: Error ) => void;

export interface SJRecord {
  [id: string]: any;
}

/**
 * Pipeline is a client for performing searches and adds on a collection.
 */
export class Pipeline {
  private client: Client;
  private name: string;

  /**
   * Create a pipeline
   */
  public constructor(client: Client, name: string) {
    this.client = client;
    this.name = name;
  }

  /**
   * Search runs a search query defined by a pipline with the given values and
   * tracking configuration. Returns the query results and returned values (which could have
   * been modified in the pipeline).
   */
  public search(values: Values, tracking: Tracking, callback: SearchCallback): void {
    const request = new XMLHttpRequest();
    request.open("POST", this.client.endpoint, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = () => {
      if (request.readyState !== 4) return;
  
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(request.responseText);
      } catch (e) {
        // const error = makeError("error parsing response");
        // callback(error, null);
        return;
      }
  
      if (request.status === 200) {
        // callback(null, parsedResponse);
        return;
      }
  
      // const error = makeError(parsedResponse.message, request.status);
      // callback(error, null);
    };
    request.send(values);
    //return request;
  }

  /**
   * Add a record to a collection using a pipeline, returning the unique key which can be used
   * to retrieve the respective record.
   */
  public add(values: Values, record: SJRecord, callback: AddCallback): void {
    const request = new XMLHttpRequest();
    request.open("POST", this.client.endpoint, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = () => {
      if (request.readyState !== 4) return;
  
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(request.responseText);
      } catch (e) {
        // const error = makeError("error parsing response");
        // callback(error, null);
        return;
      }
  
      if (request.status === 200) {
        // callback(null, parsedResponse);
        return;
      }

      // const error = makeError(parsedResponse.message, request.status);
      // callback(error, null);
    };
    request.send(values);
  }
}
