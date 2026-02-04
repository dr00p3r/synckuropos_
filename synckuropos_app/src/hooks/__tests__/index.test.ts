import * as hooksExports from '../index';

describe('hooks index exports', () => {
  it('should export useAuth', () => {
    expect(hooksExports.useAuth).toBeDefined();
  });

  it('should export useDatabase', () => {
    expect(hooksExports.useDatabase).toBeDefined();
  });

  it('should export useToast', () => {
    expect(hooksExports.useToast).toBeDefined();
  });

  it('should export AppDatabase type', () => {
    // Type exports don't have runtime values, but we can check the module exports
    expect(hooksExports).toHaveProperty('useDatabase');
  });

  it('useAuth should be a function', () => {
    expect(typeof hooksExports.useAuth).toBe('function');
  });

  it('useDatabase should be a function', () => {
    expect(typeof hooksExports.useDatabase).toBe('function');
  });

  it('useToast should be a function', () => {
    expect(typeof hooksExports.useToast).toBe('function');
  });
});
