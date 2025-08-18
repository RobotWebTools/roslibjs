export type MessageCallback<T> = (message: T) => void;

export type ValueCallback<T> = (value: T) => unknown;

export type NodeDetailsCallback = (subscriptions: string[], publications: string[], services: string[]) => unknown;
