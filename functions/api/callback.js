// GET /api/callback — يستبدل code بـ access_token ويسلّمه لنافذة Decap CMS
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = (request.headers.get('Cookie') || '').match(/oauth_state=([^;]+)/)?.[1];

  if (!code || !state || state !== cookieState) {
    return page('error', { message: 'Invalid OAuth state' }, url.origin);
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'oozem-decap-oauth' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`,
    }),
  });
  const data = await res.json();

  if (!data.access_token) {
    return page('error', { message: data.error_description || 'Token exchange failed' }, url.origin);
  }
  return page('success', { token: data.access_token, provider: 'github' }, url.origin);
}

function page(status, content, origin) {
  const msg = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!doctype html><meta charset="utf-8"><script>
(function(){
  var origin=${JSON.stringify(origin)}, msg=${JSON.stringify(msg)};
  window.addEventListener('message',function(e){
    if(e.origin!==origin)return;
    window.opener.postMessage(msg,origin);window.close();
  });
  window.opener.postMessage('authorizing:github',origin);
})();
</script>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0',
    },
  });
}
