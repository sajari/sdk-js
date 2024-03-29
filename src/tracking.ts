import { APIClient, TrackEventRequest } from "./client";
import { setItem, getItem } from "./util";

export const STORAGE_KEY = "searchio_events";
const EXPIRY_DAYS = 30;
export const FUNNEL_ENTRY_TYPES = ["click", "redirect", "promotion_click"];

type Metadata = Record<string, boolean | number | string>;
interface EventState {
  queryId: string;
  type: string;
  timestamp: number;
  submitted: boolean;
  metadata?: Metadata;
}
type Value = string | number;
type Identifier = "result_id" | "redirect_id" | "banner_id";

/**
 * SearchIOAnalytics is a utility class for tracking and sending Search.io events.
 * Event data is persisted to localStorage before being sent to track how users use
 * search results and/or move through an ecommerce purchase funnel.
 */
export class SearchIOAnalytics extends APIClient {
  events: Record<Value, EventState[]>;
  queryId?: string;

  constructor(account: string, collection: string, endpoint?: string) {
    super(account, collection, endpoint);

    const storageContent = getItem(STORAGE_KEY);
    try {
      this.events = storageContent ? JSON.parse(storageContent) : {};
    } catch (e) {
      this.events = {};
      console.error(
        "Search.io event local storage key contains corrupt data.",
        storageContent
      );
    }
    this.flush().then(() => this.purge());
  }

  add(queryId: string, type: string, value: Value, metadata?: Metadata) {
    const eventsForValue = this.getEvents(value);
    eventsForValue.push({
      queryId,
      type,
      metadata,
      timestamp: Date.now(),
      submitted: false,
    });
    this.setEvents(value, eventsForValue);
    this.save();
    this.flush();
  }

  save() {
    setItem(STORAGE_KEY, JSON.stringify(this.events));
  }

  getIdentifierForType(type: string): Identifier {
    switch (type) {
      case "redirect":
        return "redirect_id";
      case "promotion_click":
        return "banner_id";
      default:
        return "result_id";
    }
  }

  flush() {
    const sends: Promise<void>[] = [];

    Object.keys(this.events).forEach((value) => {
      this.events[value].forEach(
        ({ queryId, type, metadata, submitted }, i) => {
          if (!submitted) {
            sends.push(
              this.sendEvent(queryId, type, {
                [this.getIdentifierForType(type)]: value,
                ...(metadata && { metadata }),
              })
                .then(() => {
                  this.events[value][i].submitted = true;
                  this.save();
                })
                .catch(() => {
                  console.error(
                    "Search.io event failed to send.",
                    this.events[value][i]
                  );
                })
            );
          }
        }
      );
    });

    return Promise.all(sends).catch(() => {
      // We already log fails above
    });
  }

  async sendEvent(
    queryId: string,
    type: string,
    data: Record<string, string | Metadata>
  ): Promise<void> {
    return this.trackEvent({
      type,
      query_id: queryId,
      ...data,
    } as unknown as TrackEventRequest);
  }

  private getExpiry() {
    return Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  }

  purge() {
    const expiry = this.getExpiry();
    let requiresSave = false;

    Object.keys(this.events).forEach((value) => {
      const purged = this.events[value].filter(
        ({ submitted, timestamp }) => !submitted || timestamp > expiry
      );
      if (purged.length < this.events[value].length) {
        this.setEvents(value, purged);
        requiresSave = true;
      }
    });
    requiresSave && this.save();
  }

  getEvents(value: Value): EventState[] {
    return (this.events[value] || []).slice();
  }

  setEvents(value: Value, events: EventState[]) {
    if (events.length) {
      this.events[value] = events;
    } else {
      delete this.events[value];
    }
  }

  /**
   * Update the current queryId
   * @param queryId queryId that events calling track should be tracked against
   */
  updateQueryId(queryId: string) {
    this.queryId = queryId;
  }

  /**
   * Track events against the current queryId
   * @param type name of event to track (e.g. click, add_to_cart, purchase)
   * @param value unique result identifier (e.g. product sku)
   * @param metadata key/value pair of information relevant to the event
   */
  track(type: string, value: Value, metadata?: Metadata) {
    let queryId = this.queryId;
    if (FUNNEL_ENTRY_TYPES.includes(type)) {
      // Funnel entry events should always include their own queryId as they are tightly coupled to a specific query
      if (!queryId) {
        console.error(
          "No queryId found. Use updateQueryId to set the current queryId or call trackForQuery with a specific queryId."
        );
        return;
      }
    } else {
      // Ad-hoc events always attempt a lookup of a previously saved queryId assocaited with this identifier
      const lastEvent = this.getEvents(value).pop();

      if (lastEvent) {
        queryId = lastEvent.queryId;
      }
    }

    if (!queryId) {
      return;
    }

    this.trackForQuery(queryId, type, value, metadata);
  }

  /**
   * Track events against a specific current queryId
   * @param queryId queryId that event should be tracked against
   * @param type name of event to track (e.g. click, add_to_cart, purchase)
   * @param value unique result identifier (e.g. product sku)
   * @param metadata key/value pair of information relevant to the event
   */
  trackForQuery(
    queryId: string,
    type: string,
    value: Value,
    metadata?: Metadata
  ) {
    this.add(queryId, type, value, metadata);
  }
}
