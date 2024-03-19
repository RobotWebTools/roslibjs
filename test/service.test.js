import { it, describe, expect } from 'vitest';
import { Service, Ros } from '../';

describe('Service', () => {
  const ros = new Ros({
    url: 'ws://localhost:9090'
  });
  it('Successfully advertises a service with an async return', async () => {
    const server = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_service'
    });
    server.advertiseAsync(async () => {
      return {
        success: true,
        message: 'foo'
      }
    });
    const client = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_service'
    })
    const response = await new Promise((resolve, reject) => client.callService({}, resolve, reject));
    expect(response).toEqual({success: true, message: 'foo'});
    // Make sure un-advertisement actually disposes of the event handler
    expect(ros.listenerCount(server.name)).toEqual(1);
    server.unadvertise();
    expect(ros.listenerCount(server.name)).toEqual(0);
  })
  it('Successfully advertises a service with a synchronous return', async () => {
    const server = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_service'
    });
    server.advertise((request, response) => {
      response.success = true;
      response.message = 'bar';
      return true;
    });
    const client = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_service'
    })
    const response = await new Promise((resolve, reject) => client.callService({}, resolve, reject));
    expect(response).toEqual({success: true, message: 'bar'});
    // Make sure un-advertisement actually disposes of the event handler
    expect(ros.listenerCount(server.name)).toEqual(1);
    server.unadvertise();
    expect(ros.listenerCount(server.name)).toEqual(0);
  })
})
