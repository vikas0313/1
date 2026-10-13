import { MenuRepository, OrderRepository } from '../types/repository';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';

import { SupabaseAdapter } from './adapters/SupabaseAdapter';

class RepositoryService {
  private static instance: {
    menuRepo: MenuRepository;
    orderRepo: OrderRepository;
  } | null = null;

  public static getRepositories(): {
    menuRepo: MenuRepository;
    orderRepo: OrderRepository;
  } {
    if (!this.instance) {
      const backend = import.meta.env.VITE_DATA_BACKEND || 'local';

      if (backend === 'supabase') {
        const adapter = new SupabaseAdapter();
        this.instance = {
          menuRepo: adapter,
          orderRepo: adapter,
        };
      } else {
        const adapter = new LocalStorageAdapter();
        this.instance = {
          menuRepo: adapter,
          orderRepo: adapter,
        };
      }
    }

    return this.instance;
  }
}

export function getMenuRepository(): MenuRepository {
  return RepositoryService.getRepositories().menuRepo;
}

export function getOrderRepository(): OrderRepository {
  return RepositoryService.getRepositories().orderRepo;
}
