import type { AnyNode } from '@aedifex/core/schema'

export interface PackageItem {
  catalogId: string
  position: [number, number, number]
  rotation: [number, number, number]
}

export interface Package {
  id: string
  name: string
  description: string
  items: PackageItem[]
}

export const PACKAGES: Record<string, Package> = {
  pkg_warm_dusk_01: {
    id: 'pkg_warm_dusk_01',
    name: 'Warm Dusk',
    description:
      'A warm, inviting lighting package with floor lamps and ambient lights for evening atmosphere',
    items: [
      {
        catalogId: 'floor-lamp',
        position: [-2, 0, 2],
        rotation: [0, 0, 0],
      },
      {
        catalogId: 'floor-lamp',
        position: [2, 0, 2],
        rotation: [0, Math.PI, 0],
      },
      {
        catalogId: 'table-lamp',
        position: [-3, 0.7, -2],
        rotation: [0, 0, 0],
      },
      {
        catalogId: 'ceiling-lamp',
        position: [0, 0, 1],
        rotation: [0, 0, 0],
      },
    ],
  },
  pkg_lived_in_01: {
    id: 'pkg_lived_in_01',
    name: 'Lived-in Interior',
    description:
      'A complete furniture package that transforms the space into a cozy living interior with seating, dining, storage, and decor',
    items: [
      {
        catalogId: 'sofa',
        position: [9.3, 0, 4.5],
        rotation: [0, 0, 0],
      },
      {
        catalogId: 'coffee-table',
        position: [10.5, 0, 3],
        rotation: [0, 0, 0],
      },
      {
        catalogId: 'rectangular-carpet',
        position: [10, 0, 3.5],
        rotation: [0, 0, 0],
      },
      {
        catalogId: 'dining-table',
        position: [11, 0, 1],
        rotation: [0, 0, 0],
      },
      {
        catalogId: 'dining-chair',
        position: [10, 0, 1.5],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        catalogId: 'dining-chair',
        position: [12, 0, 1.5],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        catalogId: 'dining-chair',
        position: [10, 0, 0.5],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        catalogId: 'dining-chair',
        position: [12, 0, 0.5],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        catalogId: 'bookshelf',
        position: [12.7, 0, 5],
        rotation: [0, Math.PI, 0],
      },
      {
        catalogId: 'indoor-plant',
        position: [9.3, 0, 1],
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
