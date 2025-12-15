import { startReplications, stopReplications } from '@/helpers/replication';
import { replicateServer } from 'rxdb-server/plugins/replication-server';
import type { AppDatabase } from '@/hooks/useDatabase';

jest.mock('rxdb-server/plugins/replication-server');

describe('Replication Helper', () => {
  const mockDb = {
    collections: {
      products: { name: 'products' },
      users: { name: 'users' },
    },
  } as unknown as AppDatabase;

  const mockReplication: any = {
    error$: { subscribe: jest.fn() },
    outdatedClient$: { subscribe: jest.fn() },
    unauthorized$: { subscribe: jest.fn() },
    cancel: jest.fn(),
    isStopped: jest.fn().mockReturnValue(false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (replicateServer as jest.Mock).mockResolvedValue(mockReplication);
  });

  describe('startReplications', () => {
    it('should start replication for products and users', async () => {
      const reps = await startReplications(mockDb);
      expect(replicateServer).toHaveBeenCalledTimes(2);
      expect(reps.products).toBeDefined();
      expect(reps.users).toBeDefined();
    });
  });

  describe('stopReplications', () => {
    it('should cancel replications', () => {
        const reps = { products: mockReplication, users: mockReplication };
        stopReplications(reps);
        expect(mockReplication.cancel).toHaveBeenCalled();
    });
  });
});