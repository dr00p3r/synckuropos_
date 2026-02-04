/**
 * Demo credentials configuration
 * These are NOT real credentials - they are publicly visible demo data
 * used only for demonstration and testing purposes.
 * 
 * IMPORTANT: These credentials are intentionally visible to users
 * as part of the demo login feature.
 */

// Demo credentials are loaded from environment or use defaults for local development
// These are public demo values, not secrets
export const DEMO_CONFIG = {
  // Default demo password - this is intentionally public for demo purposes
  DEFAULT_PASSWORD: import.meta.env.VITE_DEMO_PASSWORD || '123456',
  
  // Demo user accounts
  ACCOUNTS: {
    admin: {
      username: 'admin',
      label: '👨‍💼 Acceder como Admin',
      description: 'Administrador del sistema'
    },
    cajero: {
      username: 'cajero', 
      label: '👨‍💻 Acceder como Cajero',
      description: 'Cajero del punto de venta'
    }
  },

  // Salt rounds for password hashing
  SALT_ROUNDS: 10
} as const;

// Helper to get credentials for a demo role
export const getDemoCredentials = (role: 'admin' | 'cajero') => ({
  username: DEMO_CONFIG.ACCOUNTS[role].username,
  password: DEMO_CONFIG.DEFAULT_PASSWORD
});
