export type AddressFamilyFlags = { ipv4: boolean, ipv6: boolean }
export type AddressFamilySummary = Record<string, AddressFamilyFlags>
export type AddressFamilyObservations = Record<string, Partial<AddressFamilyFlags>>
export const ADDRESS_FAMILIES_KEY = 'azeNodeAddressFamilies'

function ipv4Parts(value: string): number[] | null {
  const parts = value.split('.')
  if (parts.length !== 4 || parts.some(part => !/^(0|[1-9][0-9]{0,2})$/.test(part) || Number(part) > 255)) return null
  return parts.map(Number)
}

export function validReportedAddress(value: unknown, family: 'ipv4' | 'ipv6'): boolean {
  if (typeof value !== 'string') return false
  let address = value.trim()
  if (family === 'ipv4') {
    const parts = ipv4Parts(address)
    return !!parts && parts.some(part => part !== 0)
  }
  if (address.startsWith('[') && address.endsWith(']')) address = address.slice(1, -1)
  const zone = address.indexOf('%')
  if (zone >= 0) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(address.slice(zone + 1))) return false
    address = address.slice(0, zone)
  }
  if (address.includes('.')) {
    const end = address.lastIndexOf(':')
    const parts = ipv4Parts(address.slice(end + 1))
    if (end < 0 || !parts) return false
    address = address.slice(0, end + 1) + ((parts[0] << 8) | parts[1]).toString(16) + ':' + ((parts[2] << 8) | parts[3]).toString(16)
  }
  const halves = address.split('::')
  if (halves.length > 2) return false
  const groups = halves.flatMap(half => half ? half.split(':') : [])
  if (groups.some(group => !/^[0-9a-fA-F]{1,4}$/.test(group))) return false
  if (halves.length === 1 ? groups.length !== 8 : groups.length >= 8) return false
  return groups.some(group => parseInt(group, 16) !== 0)
}

export function normalizeAddressFamilies(raw: unknown): AddressFamilySummary {
  try { if (typeof raw === 'string') raw = JSON.parse(raw) } catch { return {} }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(Object.entries(raw as Record<string, any>).filter(([id, flags]) => id && flags && typeof flags === 'object' &&
    typeof flags.ipv4 === 'boolean' && typeof flags.ipv6 === 'boolean').map(([id, flags]) => [id, { ipv4: flags.ipv4, ipv6: flags.ipv6 }]))
}

export function reportedAddressFamilies(nodes: any[]): AddressFamilyObservations {
  return Object.fromEntries(nodes.filter(node => node && typeof node.uuid === 'string' && node.uuid &&
    (Object.hasOwn(node, 'ipv4') || Object.hasOwn(node, 'ipv6'))).map(node => {
    const flags: Partial<AddressFamilyFlags> = {}
    if (Object.hasOwn(node, 'ipv4')) flags.ipv4 = validReportedAddress(node.ipv4, 'ipv4')
    if (Object.hasOwn(node, 'ipv6')) flags.ipv6 = validReportedAddress(node.ipv6, 'ipv6')
    return [node.uuid, flags]
  }))
}

export function mergeAddressFamilies(current: AddressFamilySummary, observed: AddressFamilyObservations, publicIds: string[]): AddressFamilySummary {
  return Object.fromEntries([...new Set(publicIds)].sort().filter(id => Object.hasOwn(current, id) || Object.hasOwn(observed, id)).map(id => {
    const old = Object.hasOwn(current, id) ? current[id] : undefined
    const fresh = Object.hasOwn(observed, id) ? observed[id] : undefined
    return [id, { ipv4: fresh?.ipv4 ?? old?.ipv4 === true, ipv6: fresh?.ipv6 ?? old?.ipv6 === true }]
  }))
}

export function nodeAddressFamilies(node: any, summary: AddressFamilySummary = {}): AddressFamilyFlags {
  const saved = Object.hasOwn(summary, node?.uuid) ? summary[node.uuid] : undefined
  return {
    ipv4: node && Object.hasOwn(node, 'ipv4') ? validReportedAddress(node.ipv4, 'ipv4') : saved?.ipv4 === true,
    ipv6: node && Object.hasOwn(node, 'ipv6') ? validReportedAddress(node.ipv6, 'ipv6') : saved?.ipv6 === true
  }
}
