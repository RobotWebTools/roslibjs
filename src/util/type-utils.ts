/**
 * Type-safe wrapper for Object.hasOwn.
 * Asserts on return that the object has the property, allowing it to be used without type complaints.
 * @param obj The object to check.
 * @param prop The property to check for.
 */
export function hasOwn<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> {
  return Object.hasOwn(obj, prop);
}
