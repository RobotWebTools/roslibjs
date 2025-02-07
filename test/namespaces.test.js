import { it, describe, expect } from 'vitest';
import { Ros } from '../';

describe('Namespaces', () => {

    it("Can retrieve a list of topics using a namespace using a trailing slash", async () => {

        const ros = new Ros({
            url: 'ws://localhost:9091',
            namespace: 'hello/'
        });

        const topics = await new Promise((resolve, reject) => {
            ros.getTopics(resolve, reject);
        });

        // we expect the topics array to not be empty
        expect(topics).be.an('array');
        expect(topics).not.hasLength(0);

    });

    it("Can retrieve a list of topics using a namespace with a leading slash", async () => {

        const ros = new Ros({
            url: 'ws://localhost:9091',
            namespace: '/hello/'
        });

        const topics = await new Promise((resolve, reject) => {
            ros.getTopics(resolve, reject);
        });

        expect(topics).be.an('array');
        expect(topics).not.hasLength(0);
    });

    it("Can retrieve a list of topics using a namespace with a leading and no trailing slash", async () => {

        const ros = new Ros({
            url: 'ws://localhost:9091',
            namespace: '/hello'
        });

        const topics = await new Promise((resolve, reject) => {
            ros.getTopics(resolve, reject);
        });

        expect(topics).be.an('array');
        expect(topics).not.hasLength(0);
    })

    it("Can retrieve a list of topics using a nested namespace", async () => {

        const ros = new Ros({
            url: 'ws://localhost:9092',
            namespace: 'hello/world/'
        });

        const topics = await new Promise((resolve, reject) => {
            ros.getTopics(resolve, reject);
        });

        expect(topics).be.an('array');
        expect(topics).not.hasLength(0);
    });

    it("Can retrieve a list of topics using a nested namespace with a leading slash", async () => {

        const ros = new Ros({
            url: 'ws://localhost:9092',
            namespace: '/hello/world/'
        });

        const topics = await new Promise((resolve, reject) => {
            ros.getTopics(resolve, reject);
        });

        expect(topics).be.an('array');
        expect(topics).not.hasLength(0);
    });

    it("Can retrieve a list of topics using a nested namespace with a leading and no trailing slash", async () => {

        const ros = new Ros({
            url: 'ws://localhost:9092',
            namespace: '/hello/world'
        });

        const topics = await new Promise((resolve, reject) => {
            ros.getTopics(resolve, reject);
        });

        expect(topics).be.an('array');
        expect(topics).not.hasLength(0);
    });


    it("Can retrieve a list of topics using an empty namespaces", async () => {

        const ros = new Ros({
            url: 'ws://localhost:9090',
            namespace: ''
        });

        const topics = await new Promise((resolve, reject) => {
            ros.getTopics(resolve, reject);
        });

        expect(topics).be.an('array');
        expect(topics).not.hasLength(0);
    })

    it("Can retrieve a list of topics using an empty namespace, not set in constructor", async () => {

        const ros = new Ros({
            url: 'ws://localhost:9090'
        });

        const topics = await new Promise((resolve, reject) => {
            ros.getTopics(resolve, reject);
        });

        expect(topics).be.an('array');
        expect(topics).not.hasLength(0);
    })

})
