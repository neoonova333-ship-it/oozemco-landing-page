// GET /api/auth — يبدأ تسجيل الدخول عبر GitHub (يستدعيه Decap CMS)
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/api/callback`,
    scope: url.searchParams.get('scope') || 'repo,user',
    state,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600`,
    },
  });
}
