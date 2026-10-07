import { createApiClient } from './http-client.js';

export async function loginAs(role, credentials) {
  const client = createApiClient('api');
  try {
    const res = await client.post('/auth/login', credentials);
    const token = res.data?.token || res.data?.accessToken;
    return { success: true, token, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
