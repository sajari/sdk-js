export type SubCallback = (...data: any) => void;
export type UnSubFn = () => void;

export default class EventEmitter {
  private events: Record<string, SubCallback[]> = {};

  protected emit(event: string, ...data: any) {
    if (this.events["*"]) {
      this.events["*"].forEach(cb => cb(event, ...data));
    }
    if (!this.events[event]) {
      return;
    }

    this.events[event].forEach(cb => cb(...data));
  }

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
