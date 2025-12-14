import { createServerDatabase } from '../db';
import { addRxPlugin, createRxDatabase } from 'rxdb';

jest.mock('rxdb');
jest.mock('rxdb/plugins/storage-mongodb');

describe('Server Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create database with correct name', async () => {
    const mockDb = {
      addCollections: jest.fn().mockResolvedValue(undefined),
    };

    (createRxDatabase as jest.Mock).mockResolvedValue(mockDb);

    const result = await createServerDatabase();

    expect(createRxDatabase).toHaveBeenCalled();
    const call = (createRxDatabase as jest.Mock).mock.calls[0][0];
    expect(call.name).toBe('synckuroposdb-server');
  });

  it('should add all required collections', async () => {
    const mockDb = {
      addCollections: jest.fn().mockResolvedValue(undefined),
    };

    (createRxDatabase as jest.Mock).mockResolvedValue(mockDb);

    await createServerDatabase();

    expect(mockDb.addCollections).toHaveBeenCalled();
    const collectionsCall = (mockDb.addCollections as jest.Mock).mock.calls[0][0];

    expect(collectionsCall).toHaveProperty('products');
    expect(collectionsCall).toHaveProperty('customers');
    expect(collectionsCall).toHaveProperty('users');
    expect(collectionsCall).toHaveProperty('sales');
    expect(collectionsCall).toHaveProperty('debts');
  });

  it('should enable eventReduce for performance', async () => {
    const mockDb = {
      addCollections: jest.fn().mockResolvedValue(undefined),
    };

    (createRxDatabase as jest.Mock).mockResolvedValue(mockDb);

    await createServerDatabase();

    const call = (createRxDatabase as jest.Mock).mock.calls[0][0];
    expect(call.eventReduce).toBe(true);
  });

  it('should have multiInstance disabled', async () => {
    const mockDb = {
      addCollections: jest.fn().mockResolvedValue(undefined),
    };

    (createRxDatabase as jest.Mock).mockResolvedValue(mockDb);

    await createServerDatabase();

    const call = (createRxDatabase as jest.Mock).mock.calls[0][0];
    expect(call.multiInstance).toBe(false);
  });

  it('should use MongoDB storage', async () => {
    const mockDb = {
      addCollections: jest.fn().mockResolvedValue(undefined),
    };

    (createRxDatabase as jest.Mock).mockResolvedValue(mockDb);

    await createServerDatabase();

    const call = (createRxDatabase as jest.Mock).mock.calls[0][0];
    expect(call.storage).toBeDefined();
  });
});
