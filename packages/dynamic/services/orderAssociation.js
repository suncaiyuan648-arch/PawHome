/** Animal aliases describe the same set; singular aliases must agree and belong to it. */
export function animalIdsOfOrder(order = {}) {
  const singular = []
  const sets = []
  const valid = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)
  const invalid = () => ({ values: [], error: 'INVALID_ANIMAL_RELATION' })
  for (const field of ['animalId', 'petId']) {
    if (!Object.prototype.hasOwnProperty.call(order, field)) continue
    if (!valid(order[field])) return invalid()
    singular.push(order[field])
  }
  for (const field of ['animalIds', 'petIds']) {
    if (!Object.prototype.hasOwnProperty.call(order, field)) continue
    if (!Array.isArray(order[field]) || !order[field].length || order[field].some(id => !valid(id))) return invalid()
    sets.push([...new Set(order[field])].sort())
  }
  if (new Set(singular).size > 1) return invalid()
  if (sets.some(ids => ids.join('|') !== sets[0].join('|'))) return invalid()
  if (sets.length && singular.some(id => !sets[0].includes(id))) return invalid()
  return { values: sets[0] || [...new Set(singular)], error: null }
}

// The feeding store implies normal_feed for legacy rows without a type.
// Signed/delivered orders may accrue evidence up to their persisted policy limit.
export function isFeedbackEligible(order = {}) {
  const types = ['orderType', 'type'].filter(key => order[key] !== undefined).map(key => order[key])
  if (types.some(type => type !== 'normal_feed')) return false
  const states = ['status', 'stateKey', 'deliveryStatus'].filter(key => order[key] !== undefined).map(key => order[key])
  const allowed = ['delivered', 'fulfilled', 'completed', 'cloud-active-timeout', 'cloud-active-feedback']
  return states.length > 0 && states.every(state => allowed.includes(state))
}
