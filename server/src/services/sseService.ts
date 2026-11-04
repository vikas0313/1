import type { FastifyReply } from 'fastify';

export type SseChannelType = 'owner' | `order:${string}`;

interface SseClient {
  id: string;
  reply: FastifyReply;
  channel: SseChannelType;
}

class SseService {
  private clients: Set<SseClient> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  public addClient(reply: FastifyReply, channel: SseChannelType): SseClient {
    const raw = reply.raw;
    raw.setHeader('Content-Type', 'text/event-stream');
    raw.setHeader('Cache-Control', 'no-cache, no-transform');
    raw.setHeader('Connection', 'keep-alive');
    raw.setHeader('X-Accel-Buffering', 'no'); // for reverse proxies like Nginx/Render
    raw.flushHeaders?.();

    const client: SseClient = {
      id: Math.random().toString(36).substring(2, 10),
      reply,
      channel,
    };

    this.clients.add(client);

    // Initial connection comment
    raw.write(`: connected\n\n`);

    raw.on('close', () => {
      this.removeClient(client);
    });

    return client;
  }

  public removeClient(client: SseClient): void {
    this.clients.delete(client);
  }

  public broadcast(event: string, data: unknown, targetChannel?: SseChannelType): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of this.clients) {
      if (!targetChannel || client.channel === targetChannel || (targetChannel === 'owner' && client.channel === 'owner')) {
        try {
          client.reply.raw.write(payload);
        } catch {
          this.removeClient(client);
        }
      }
    }
  }

  public notifyOrderCreated(order: unknown): void {
    this.broadcast('order.created', order, 'owner');
  }

  public notifyOrderUpdated(order: { public_token: string } & Record<string, unknown>): void {
    // Notify owner stream
    this.broadcast('order.updated', order, 'owner');
    // Notify customer stream for this order token
    this.broadcast('order.updated', order, `order:${order.public_token}`);
  }

  public notifyMenuUpdated(data?: unknown): void {
    this.broadcast('menu.updated', data ?? { updated_at: new Date().toISOString() });
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      for (const client of this.clients) {
        try {
          client.reply.raw.write(`: heartbeat ${Date.now()}\n\n`);
        } catch {
          this.removeClient(client);
        }
      }
    }, 15000);
  }

  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}

export const sseService = new SseService();

