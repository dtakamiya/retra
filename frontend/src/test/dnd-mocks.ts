import { vi } from 'vitest'

/**
 * @dnd-kit のテスト用モック生成関数群。
 *
 * vi.mock のファクトリ内では外部変数を参照できないため（ホイスティングされる）、
 * vi.hoisted() と組み合わせて使用する。
 *
 * 使い方:
 *   import { vi } from 'vitest'
 *   const { createDndCoreMock, createDndSortableMock, createDndUtilitiesMock } = vi.hoisted(
 *     () => import('../test/dnd-mocks').then(m => ({
 *       createDndCoreMock: m.createDndCoreMock,
 *       createDndSortableMock: m.createDndSortableMock,
 *       createDndUtilitiesMock: m.createDndUtilitiesMock,
 *     }))
 *   )
 *
 * もしくは、各テストでインラインファクトリとして使用:
 *   vi.mock('@dnd-kit/core', async () => {
 *     const { createDndCoreMock } = await import('../test/dnd-mocks')
 *     return createDndCoreMock()
 *   })
 */

export function createDndCoreMock() {
  return {
    DndContext: ({ children }: { children: React.ReactNode }) => children,
    DragOverlay: ({ children }: { children: React.ReactNode }) => children,
    closestCorners: vi.fn(),
    PointerSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
    useSensor: vi.fn(),
    useSensors: () => [],
    useDroppable: () => ({ setNodeRef: vi.fn() }),
  }
}

export function createDndSortableMock() {
  return {
    SortableContext: ({ children }: { children: React.ReactNode }) => children,
    verticalListSortingStrategy: {},
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    }),
  }
}

export function createDndUtilitiesMock() {
  return {
    CSS: {
      Transform: {
        toString: () => undefined,
      },
    },
  }
}
