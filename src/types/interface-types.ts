/**
 * Represents a type that can either be a value of type `T` or `undefined`.
 */
export type Optional<T> = T | undefined;

/**
 * Represents a type that can either be a value of type `T` or `null`.
 */
export type Nullable<T> = T | null;

/**
 * Represents an object type where all properties are optional, and included properties can be null or undefined.
 */
export type PartialNullable<T> = {
  [P in keyof T]?: Nullable<T[P]>;
};
