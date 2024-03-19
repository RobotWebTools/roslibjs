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
  })
})
