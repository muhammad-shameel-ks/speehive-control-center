export function partitionByCompleted<T extends { completed: boolean }>(items: T[] | null): {
  pending: T[];
  done: T[];
} {
  if (!items) return { pending: [], done: [] };
  return {
    pending: items.filter((t) => !t.completed),
    done: items.filter((t) => t.completed),
  };
}
