import { startReplications, stopReplications } from '@/helpers/replication';
import { replicateServer } from 'rxdb-server/plugins/replication-server';

jest.mock('rxdb-server/plugins/replication-server');

describe('Replication Helper', () => {
  const mockDb = {
    collections: {
      products: {
        name: 'products',
      },
      users: {
        name: 'users',
      },
    },
  };

  const mockReplication = {
    error$: {
      subscribe: jest.fn(),
    },
    outdatedClient$: {
      subscribe: jest.fn(),
    },
    unauthorized$: {
      subscribe: jest.fn(),
    },
    cancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (replicateServer as jest.Mock).mockResolvedValue(mockReplication);
  });

  describe('startReplications', () => {
    it('should start replication for products and users', async () => {
      const reps = await startReplications(mockDb as any);

      expect(replicateServer).toHaveBeenCalledTimes(2);
      expect(reps.products).toBeDefined();
      expect(reps.users).toBeDefined();
    });

    it('should configure products replication with correct URL', async () => {
      await startReplications(mockDb as any);

      const firstCall = (replicateServer as jest.Mock).mock.calls[0][0];
      expect(firstCall.collection).toBe(mockDb.collections.products);
      expect(firstCall.replicationIdentifier).toBe('products-replication-v0');
      expect(firstCall.url).toContain('/products/0');
    });

    it('should configure users replication with correct URL', async () => {
      await startReplications(mockDb as any);

      const secondCall = (replicateServer as jest.Mock).mock.calls[1][0];
      expect(secondCall.collection).toBe(mockDb.collections.users);
      expect(secondCall.replicationIdentifier).toBe('users-replication-v0');
      expect(secondCall.url).toContain('/users/0');
    });

    it('should subscribe to error events', async () => {
      await startReplications(mockDb as any);

      expect(mockReplication.error$.subscribe).toHaveBeenCalled();
    });

    it('should set live: true for continuous replication', async () => {
      await startReplications(mockDb as any);

      const firstCall = (replicateServer as jest.Mock).mock.calls[0][0];
      expect(firstCall.live).toBe(true);
    });
  });

  describe('stopReplications', () => {
    it('should cancel products replication', () => {
      const reps = { products: mockReplication, users: mockReplication };
      stopReplications(reps);

      expect(mockReplication.cancel).toHaveBeenCalled();
    });

    it('should cancel users replication', () => {
      const reps = { products: mockReplication, users: mockReplication };
      stopReplications(reps);

      expect(mockReplication.cancel).toHaveBeenCalled();
    });

    it('should handle undefined replications gracefully', () => {
      expect(() => {
        stopReplications(undefined);
      }).not.toThrow();
    });

    it('should handle partial replications', () => {
      const partialReps = { products: mockReplication };
      expect(() => {
        stopReplications(partialReps as any);
      }).not.toThrow();
    });
  });
});
