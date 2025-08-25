async function htmlCloseWithMessage(type, data) {
  const payload = JSON.stringify(data);
  // Decap (Netlify/Decap CMS) が待ってる postMessage 形式
  return new Response(
    `<!doctype html><meta charset="utf-8">
     <script>
       (function(){
         function send(){
           window.opener && window.opener.postMessage({ type: "authorization:github:${type}", data: ${payload} }, "*");
           window.close();
         }
         send();
       })();
     </script>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const cookies = Object.fromEntries((request.headers.get("Cookie") || "").split(";").map(c=>{
      const i = c.indexOf("="); if(i<0) return ["",""];
      return [c.slice(0,i).trim(), decodeURIComponent(c.slice(i+1))]
    }));
    if (!code || !state || !cookies.oauth_state || state !== cookies.oauth_state) {
      return htmlCloseWithMessage("error", { message: "Invalid OAuth state" });
    }

    // GitHub でアクセストークン交換
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        code,
        redirect_uri: env.REDIRECT_URI
      })
    });
    const json = await res.json();
    if (!json.access_token) {
      return htmlCloseWithMessage("error", { message: json.error_description || "No access_token" });
    }

    // 送信許可ドメインを制限（任意・推奨）
    const originCookie = cookies.oauth_origin || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s=>s.trim()).filter(Boolean);
    if (allowed.length && originCookie && !allowed.includes(originCookie)) {
      return htmlCloseWithMessage("error", { message: "Origin not allowed" });
    }

    // 成功メッセージ（Decapが受け取って保存する）
    return htmlCloseWithMessage("success", { token: json.access_token });

  } catch (e) {
    return htmlCloseWithMessage("error", { message: e.message || "OAuth error" });
  }
}
