export function hasOwn<X extends object, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
  return Object.hasOwn(obj, prop);
}
