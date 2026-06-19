import { queryClient } from './queryClient';
import { queryKeys, type DbCollectionKey } from './queryKeys';

export function invalidateDbQuery(collection: DbCollectionKey): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys[collection] });
}

export function invalidateAllDbQueries(): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
  void queryClient.invalidateQueries({ queryKey: queryKeys.employees });
  void queryClient.invalidateQueries({ queryKey: queryKeys.clients });
  void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
}