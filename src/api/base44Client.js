import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "686f03e3f9060724fa78a44c", 
  requiresAuth: true // Ensure authentication is required for all operations
});
