import { it, describe, expect, vi } from "vitest";
import { Service, Ros } from "../src/RosLib.ts";

describe("Service", () => {
  const ros = new Ros({
    url: "ws://localhost:9090",
  });

  it("Successfully advertises a service with an async return", async () => {
    const server = new Service({
      ros,
      serviceType: "std_srvs/Trigger",
      name: "/test_service",
    });
    await server.advertiseAsync(async () =>
      Promise.resolve({
        success: true,
        message: "foo",
      }),
    );
    const client = new Service({
      ros,
      serviceType: "std_srvs/Trigger",
      name: "/test_service",
    });
    const callback = vi.fn();
    client.callService({}, callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledExactlyOnceWith({
        success: true,
        message: "foo",
      });
    });
    // Make sure un-advertisement actually disposes of the event handler
    expect(ros.listenerCount(server.name)).toEqual(1);
    await server.unadvertise();
    expect(ros.listenerCount(server.name)).toEqual(0);
  });
  it("Successfully advertises a service with a synchronous return", async () => {
    const server = new Service<
      undefined,
      { success: boolean; message: string }
    >({
      ros,
      serviceType: "std_srvs/Trigger",
      name: "/test_service",
    });
    await server.advertise((_request, response) => {
      response.success = true;
      response.message = "bar";
      return true;
    });
    const client = new Service({
      ros,
      serviceType: "std_srvs/Trigger",
      name: "/test_service",
    });
    const callback = vi.fn();
    client.callService({}, callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledExactlyOnceWith({
        success: true,
        message: "bar",
      });
      // synchronous is way slower than asynchronous for some reason. I guess this vindicates my adding the async option?
    }, 3000);
    // Make sure un-advertisement actually disposes of the event handler
    expect(ros.listenerCount(server.name)).toEqual(1);
    await server.unadvertise();
    expect(ros.listenerCount(server.name)).toEqual(0);
  });

  it("Handles re-advertisement gracefully without throwing errors", async () => {
    const server = new Service<
      undefined,
      { success: boolean; message: string }
    >({
      ros,
      serviceType: "std_srvs/Trigger",
      name: "/test_readvertise",
    });

    // First advertisement
    await server.advertise((_request, response) => {
      response.success = true;
      response.message = "first";
      return true;
    });

    expect(server.isAdvertised).toBe(true);
    expect(ros.listenerCount(server.name)).toEqual(1);

    // Re-advertise with different callback - should not throw
    await server.advertise((_request, response) => {
      response.success = true;
      response.message = "second";
      return true;
    });

    expect(server.isAdvertised).toBe(true);
    expect(ros.listenerCount(server.name)).toEqual(1);

    await server.unadvertise();
    expect(server.isAdvertised).toBe(false);
    expect(ros.listenerCount(server.name)).toEqual(0);
  });

  it("Handles multiple unadvertise calls gracefully", async () => {
    const server = new Service<
      undefined,
      { success: boolean; message: string }
    >({
      ros,
      serviceType: "std_srvs/Trigger",
      name: "/test_multiple_unadvertise",
    });

    await server.advertise((_request, response) => {
      response.success = true;
      return true;
    });

    expect(server.isAdvertised).toBe(true);

    // First unadvertise
    await server.unadvertise();
    expect(server.isAdvertised).toBe(false);

    // Second unadvertise - should not throw
    await server.unadvertise();

    expect(server.isAdvertised).toBe(false);
  });

  it("Handles re-advertisement with advertiseAsync gracefully", async () => {
    const server = new Service({
      ros,
      serviceType: "std_srvs/Trigger",
      name: "/test_readvertise_async",
    });

    // First advertisement
    await server.advertiseAsync(async () =>
      Promise.resolve({
        success: true,
        message: "first",
      }),
    );

    expect(server.isAdvertised).toBe(true);

    // Re-advertise with different callback - should not throw
    await server.advertiseAsync(async () =>
      Promise.resolve({
        success: true,
        message: "second",
      }),
    );

    expect(server.isAdvertised).toBe(true);

    await server.unadvertise();
    expect(server.isAdvertised).toBe(false);
  });

  it("Ensures operations are serialized through queue", async () => {
    const server = new Service<
      undefined,
      { success: boolean; message: string }
    >({
      ros,
      serviceType: "std_srvs/Trigger",
      name: "/test_queue",
    });

    // Rapid advertise/unadvertise operations
    const operations = [
      server.advertise((_request, response) => {
        response.success = true;
        response.message = "first";
        return true;
      }),
      server.unadvertise(),
      server.advertise((_request, response) => {
        response.success = true;
        response.message = "second";
        return true;
      }),
      server.unadvertise(),
      server.advertise((_request, response) => {
        response.success = true;
        response.message = "third";
        return true;
      }),
    ];

    // All operations should complete without errors
    await Promise.all(operations);

    // Final state should be advertised
    expect(server.isAdvertised).toBe(true);

    await server.unadvertise();
    expect(server.isAdvertised).toBe(false);
  });
});
