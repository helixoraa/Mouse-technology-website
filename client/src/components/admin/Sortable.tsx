import type { ReactNode } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableList({ ids, onReorder, children }: { ids: string[]; onReorder: (ids: string[]) => void; children: ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} accessibility={{ container: document.body }}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** Sortable row. `children` receives the drag handle (mouse + keyboard: focus it, Space, arrows, Space). */
export function SortableItem({
  id,
  as = 'div',
  className,
  children,
}: {
  id: string;
  as?: 'div' | 'tr';
  className?: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  };
  const handle = (
    <button
      type="button"
      aria-label="Drag to reorder"
      title="Drag to reorder (or focus and press Space, then arrow keys)"
      className="cursor-grab touch-none rounded-lg px-2 py-1 text-lg leading-none text-ink-500 hover:bg-surface-tint active:cursor-grabbing max-lg:flex max-lg:min-h-11 max-lg:min-w-11 max-lg:items-center max-lg:justify-center"
      {...attributes}
      {...listeners}
    >
      ⠿
    </button>
  );
  if (as === 'tr')
    return (
      <tr ref={setNodeRef} style={style} className={className}>
        {children(handle)}
      </tr>
    );
  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children(handle)}
    </div>
  );
}
