import { describe, it, expect } from 'vitest';
import {
  canTransition,
  getNextStep,
  canCancel,
  assertValidTransition,
  VALID_TRANSITIONS,
} from './stateMachine.js';

describe('State Machine (shared/stateMachine)', () => {
  it('allows valid progressive transitions', () => {
    expect(canTransition('pending', 'preparing')).toBe(true);
    expect(canTransition('preparing', 'ready')).toBe(true);
    expect(canTransition('ready', 'complete')).toBe(true);
  });

  it('allows cancellation only from pending or preparing', () => {
    expect(canCancel('pending')).toBe(true);
    expect(canCancel('preparing')).toBe(true);
    expect(canCancel('ready')).toBe(false);
    expect(canCancel('complete')).toBe(false);
    expect(canCancel('cancelled')).toBe(false);

    expect(canTransition('pending', 'cancelled')).toBe(true);
    expect(canTransition('preparing', 'cancelled')).toBe(true);
    expect(canTransition('ready', 'cancelled')).toBe(false);
  });

  it('rejects skipping steps forward or moving backwards', () => {
    expect(canTransition('pending', 'ready')).toBe(false);
    expect(canTransition('pending', 'complete')).toBe(false);
    expect(canTransition('preparing', 'pending')).toBe(false);
    expect(canTransition('ready', 'preparing')).toBe(false);
    expect(canTransition('complete', 'ready')).toBe(false);
    expect(canTransition('cancelled', 'pending')).toBe(false);
  });

  it('getNextStep returns the next forward step or null for terminal', () => {
    expect(getNextStep('pending')).toBe('preparing');
    expect(getNextStep('preparing')).toBe('ready');
    expect(getNextStep('ready')).toBe('complete');
    expect(getNextStep('complete')).toBe(null);
    expect(getNextStep('cancelled')).toBe(null);
  });

  it('assertValidTransition throws on illegal transitions and passes on valid ones', () => {
    expect(() => assertValidTransition('pending', 'preparing')).not.toThrow();
    expect(() => assertValidTransition('pending', 'ready')).toThrow(/Illegal order status transition/);
  });

  it('exports VALID_TRANSITIONS correctly', () => {
    expect(VALID_TRANSITIONS.pending).toEqual(['preparing', 'cancelled']);
  });
});

