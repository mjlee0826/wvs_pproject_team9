import axios from 'axios';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAdminToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.LOGTO_M2M_APP_ID!,
    client_secret: process.env.LOGTO_M2M_APP_SECRET!,
    resource: `${process.env.LOGTO_ENDPOINT}/api`,
    scope: 'all',
  });

  const { data } = await axios.post(
    `${process.env.LOGTO_ENDPOINT}/oidc/token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  cachedToken = data.access_token as string;
  tokenExpiry = Date.now() + (data.expires_in as number) * 1000;
  return cachedToken;
}

export async function logtoRequest<T>(
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
  path: string,
  data?: unknown,
): Promise<T> {
  const token = await getAdminToken();
  const response = await axios.request<T>({
    method,
    url: `${process.env.LOGTO_ENDPOINT}/api${path}`,
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  return response.data;
}
