import { it, describe, expect, beforeEach, vi } from "vitest";
import SocketAdapter from "../src/core/SocketAdapter.js";

describe("SocketAdapter fragment handling", () => {
  let client;
  let adapter;

  beforeEach(() => {
    client = {
      emit: vi.fn(),
      transportOptions: {},
    };
    adapter = SocketAdapter(client);
    vi.clearAllMocks();
  });

  function sendFragment(id, total, fragments) {
    for (let i = 0; i < fragments.length; i++) {
      adapter.onmessage({
        data: JSON.stringify({
          op: "fragment",
          id,
          data: fragments[i],
          num: i,
          total,
        }),
      });
    }
  }

  it("reassembles fragments and emits message", () => {
    const id = "test1";
    const total = 3;
    const msg = { op: "publish", topic: "foo", msg: { data: 42 } };
    const json = JSON.stringify(msg);
    const fragments = [json.slice(0, 10), json.slice(10, 20), json.slice(20)];
    sendFragment(id, total, fragments);
    expect(client.emit).toHaveBeenCalledWith("foo", { data: 42 });
    expect(client.emit).toHaveBeenCalledTimes(1);
  });

  it("handles float total by using integer part", () => {
    const id = "test2";
    const total = 2.9;
    const msg = { op: "publish", topic: "bar", msg: { data: 99 } };
    const json = JSON.stringify(msg);
    const fragments = [json.slice(0, 10), json.slice(10)];
    sendFragment(id, total, fragments);
    expect(client.emit).toHaveBeenCalledWith("bar", { data: 99 });
    expect(client.emit).toHaveBeenCalledTimes(1);
  });

  it("ignores extra fragments beyond integer total", () => {
    const id = "test3";
    const total = 2.1;
    const msg = { op: "publish", topic: "baz", msg: { data: 7 } };
    const json = JSON.stringify(msg);
    const fragments = [json.slice(0, 10), json.slice(10), "extra"];
    sendFragment(id, total, fragments);
    expect(client.emit).toHaveBeenCalledWith("baz", { data: 7 });
    expect(client.emit).toHaveBeenCalledTimes(1);
  });

  it("does not emit if fragments are missing", () => {
    const id = "test4";
    const total = 2;
    const msg = { op: "publish", topic: "qux", msg: { data: 123 } };
    const json = JSON.stringify(msg);
    const fragments = [json.slice(0, 10)]; // missing one fragment
    sendFragment(id, total, fragments);
    expect(client.emit).not.toHaveBeenCalledWith("qux", { data: 123 });
  });

  it("ignores malformed fragments", () => {
    adapter.onmessage({ data: JSON.stringify({ op: "fragment", id: "bad" }) });
    expect(client.emit).not.toHaveBeenCalled();
  });
});
