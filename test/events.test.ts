import { EventEmitter } from "../src/index";

class testEmitter extends EventEmitter {
  send(event: string, ...data: any) {
    this.emit(event, ...data);
  }
}

describe("EventEmitter", () => {
  it("emit event", () => {
    const events = new testEmitter();

    const cb = jest.fn();
    events.on("test-event", cb);
    events.send("test-event");

    expect(cb.mock.calls.length).toBe(1);
  });

  it("handle multiple listeners", () => {
    const events = new testEmitter();

    const cb = jest.fn();
    events.on("test-event", cb);
    events.on("test-event", cb);
    events.on("test-event", cb);

    events.send("test-event");

    expect(cb.mock.calls.length).toBe(3);
  });

  it("handle * listener", () => {
    const events = new testEmitter();

    const cb = jest.fn();
    events.on("*", cb);

    events.send("event-1");
    events.send("event-2");
    events.send("event-3");
    events.send("event-4");
    events.send("event-5");

    expect(cb.mock.calls.length).toBe(5);
  });

  it("unsubscribe", () => {
    const events = new testEmitter();

    const cb = jest.fn();
    const unsub = events.on("*", cb);

    events.send("event-1");
    unsub();

    events.send("event-2");
    events.send("event-3");
    events.send("event-4");
    events.send("event-5");

    expect(cb.mock.calls.length).toBe(1);
  });
});
