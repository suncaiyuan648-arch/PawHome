/** Declare an internal Vue event's argument tuple. External payloads must be
 * parsed before emission; this helper does not claim runtime validation. */
export function eventContract<Args extends readonly unknown[]>(): (...args: Args) => true {
  return () => true
}
