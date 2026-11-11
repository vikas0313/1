import type {
  Category,
  MenuItem,
  Order,
  RestaurantSettings,
  Table,
} from '@ritsu/shared';

export interface CreateOrderParams {
  table_label: string;
  customer_name: string;
  note?: string;
  client_request_id?: string;
  items: Array<{
    menu_item_id: string;
    variant_id: string;
    quantity: number;
  }>;
}

export class ApiAdapter {
  private baseUrl = '';

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  public async getRestaurantSettings(): Promise<RestaurantSettings> {
    const res = await fetch(`${this.baseUrl}/api/restaurant`);
    if (!res.ok) {
      throw new Error(`Failed to load restaurant settings: ${res.statusText}`);
    }
    return res.json();
  }

  public async getMenu(): Promise<{ categories: Category[]; items: MenuItem[] }> {
    const res = await fetch(`${this.baseUrl}/api/menu`);
    if (!res.ok) {
      throw new Error(`Failed to load menu: ${res.statusText}`);
    }
    return res.json();
  }

  public async getTable(label: string): Promise<Table | null> {
    const res = await fetch(`${this.baseUrl}/api/tables/${encodeURIComponent(label)}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to check table: ${res.statusText}`);
    }
    return res.json();
  }

  public async createOrder(params: CreateOrderParams): Promise<Order> {
    const requestId =
      params.client_request_id ||
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const body = {
      ...params,
      client_request_id: requestId,
    };

    const res = await fetch(`${this.baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || `Order failed (${res.status})`);
    }

    return res.json();
  }

  public async getOrderByToken(publicToken: string): Promise<Order> {
    const res = await fetch(`${this.baseUrl}/api/orders/${encodeURIComponent(publicToken)}`);
    if (!res.ok) {
      throw new Error(`Order not found or link expired (${res.status})`);
    }
    return res.json();
  }

  /**
   * Subscribes to live order updates via Server-Sent Events with polling fallback.
   */
  public subscribeToOrder(
    publicToken: string,
    callback: (order: Order) => void,
    onStatusChange?: (status: 'connected' | 'reconnecting' | 'polling') => void
  ): () => void {
    let closed = false;
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollInterval || closed) return;
      onStatusChange?.('polling');
      pollInterval = setInterval(async () => {
        try {
          const order = await this.getOrderByToken(publicToken);
          callback(order);
        } catch {
          // ignore transient poll errors
        }
      }, 5000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const connectSSE = () => {
      if (closed) return;
      onStatusChange?.('reconnecting');

      try {
        eventSource = new EventSource(`${this.baseUrl}/api/orders/${encodeURIComponent(publicToken)}/stream`);

        eventSource.onopen = () => {
          stopPolling();
          onStatusChange?.('connected');
        };

        eventSource.addEventListener('order.updated', (event) => {
          try {
            const data = JSON.parse(event.data);
            callback(data);
          } catch (err) {
            console.error('Error parsing order.updated SSE:', err);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          startPolling();
          // Attempt SSE reconnection after 10s
          setTimeout(() => {
            if (!closed && !eventSource) {
              connectSSE();
            }
          }, 10000);
        };
      } catch {
        startPolling();
      }
    };

    connectSSE();

    return () => {
      closed = true;
      stopPolling();
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }

  /**
   * Subscribes to owner live stream via SSE.
   */
  public subscribeToOwnerStream(
    onEvent: (type: string, data: any) => void,
    onStatusChange?: (status: 'connected' | 'reconnecting') => void
  ): () => void {
    let closed = false;
    let eventSource: EventSource | null = null;

    const connect = () => {
      if (closed) return;
      onStatusChange?.('reconnecting');

      try {
        eventSource = new EventSource(`${this.baseUrl}/api/owner/stream`, {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          onStatusChange?.('connected');
        };

        eventSource.addEventListener('order.created', (event) => {
          onEvent('order.created', JSON.parse(event.data));
        });

        eventSource.addEventListener('order.updated', (event) => {
          onEvent('order.updated', JSON.parse(event.data));
        });

        eventSource.addEventListener('menu.updated', (event) => {
          onEvent('menu.updated', JSON.parse(event.data));
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          onStatusChange?.('reconnecting');
          setTimeout(() => {
            if (!closed) connect();
          }, 5000);
        };
      } catch {
        setTimeout(() => {
          if (!closed) connect();
        }, 5000);
      }
    };

    connect();

    return () => {
      closed = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }
}

export const apiAdapter = new ApiAdapter(
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || ''
);

