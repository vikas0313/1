import { MenuRepository, OrderRepository } from '../types/repository';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';

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
      const adapter = new LocalStorageAdapter();
      this.instance = {
        menuRepo: adapter,
        orderRepo: adapter,
      };
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
