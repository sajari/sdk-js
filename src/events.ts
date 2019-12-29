export type SubCallback = (...data: any) => void;
export type UnSubFn = () => void;

/**
 * Class is to provide a framework for managing events and to be able subscribes to them
 */
export default class EventEmitter {
  private events: Record<string, SubCallback[]> = {};

  /**
   * Take event name and the data will be sent with the event
   * If the event is in the events map, the existing function linked with the event will be called with the data
   *
   * @param event
   * @param data
   */
  protected emit(event: string, ...data: any) {
    if (this.events["*"]) {
      this.events["*"].forEach(cb => cb(event, ...data));
    }
    if (!this.events[event]) {
      return;
    }

    this.events[event].forEach(cb => cb(...data));
  }

  /**
   * Takes a event name and a callback function which is triggered when the event is emitted
   *
   * @param event
   * @param callback
   */
  public on(event: string, callback: SubCallback): UnSubFn {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    return () => {
      this.events[event] = this.events[event].filter(item => item !== callback);
    };
  }
}
