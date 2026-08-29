import type { AnyNode } from '@aedifex/core/schema'

export interface Package {
  id: string
  name: string
  description: string
  items: Array<{
    type: 'item'
    catalogId: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale?: [number, number, number]
    metadata?: Record<string, unknown>
  }>
}

export const PACKAGES: Record<string, Package> = {
  pkg_warm_dusk_01: {
    id: 'pkg_warm_dusk_01',
    name: 'Warm Dusk',
    description:
      'A warm, inviting lighting package with floor lamps and ambient lights for evening atmosphere',
    items: [
      {
        type: 'item',
        catalogId: 'floor_lamp_01',
        position: [-2, 0, 2],
        rotation: [0, 0, 0],
      },
      {
        type: 'item',
        catalogId: 'floor_lamp_01',
        position: [2, 0, 2],
        rotation: [0, Math.PI, 0],
      },
      {
        type: 'item',
        catalogId: 'table_lamp_01',
        position: [-3, 0.7, -2],
        rotation: [0, 0, 0],
      },
      {
        type: 'item',
        catalogId: 'pendant_light_01',
        position: [0, 0, 1],
        rotation: [0, 0, 0],
      },
    ],
  },
}

export function validatePackage(
  packageId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scene: unknown,
): { valid: boolean; error?: string } {
  const pkg = PACKAGES[packageId]
  if (!pkg) {
    return { valid: false, error: `Package ${packageId} not found` }
  }

  return { valid: true }
}
