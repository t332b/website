import 'kleur/colors';
import { k as decodeKey } from './chunks/astro/server_DQmaf8SQ.mjs';
import 'clsx';
import 'cookie';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_XOGgtBjb.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/iwata/Documents/workspace/development/WebsiteManagement/website/","cacheDir":"file:///Users/iwata/Documents/workspace/development/WebsiteManagement/website/node_modules/.astro/","outDir":"file:///Users/iwata/Documents/workspace/development/WebsiteManagement/website/dist/","srcDir":"file:///Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/","publicDir":"file:///Users/iwata/Documents/workspace/development/WebsiteManagement/website/public/","buildClientDir":"file:///Users/iwata/Documents/workspace/development/WebsiteManagement/website/dist/client/","buildServerDir":"file:///Users/iwata/Documents/workspace/development/WebsiteManagement/website/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"admin/index.html","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","isIndex":false,"route":"/admin","pattern":"^\\/admin\\/?$","segments":[[{"content":"admin","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro-decap-cms-oauth/src/admin.astro","pathname":"/admin","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"external","_meta":{"trailingSlash":"ignore"}}},{"file":"blog/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/blog","isIndex":true,"type":"page","pattern":"^\\/blog\\/?$","segments":[[{"content":"blog","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/blog/index.astro","pathname":"/blog","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"stg/test/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/stg/test","isIndex":true,"type":"page","pattern":"^\\/stg\\/test\\/?$","segments":[[{"content":"stg","dynamic":false,"spread":false}],[{"content":"test","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/stg/test/index.astro","pathname":"/stg/test","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/oauth/callback","pattern":"^\\/oauth\\/callback\\/?$","segments":[[{"content":"oauth","dynamic":false,"spread":false}],[{"content":"callback","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro-decap-cms-oauth/src/oauth/callback.ts","pathname":"/oauth/callback","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"external","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/oauth","pattern":"^\\/oauth\\/?$","segments":[[{"content":"oauth","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro-decap-cms-oauth/src/oauth/index.ts","pathname":"/oauth","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"external","_meta":{"trailingSlash":"ignore"}}}],"site":"https://pr0p0se.com","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/iwata/Documents/workspace/development/WebsiteManagement/website/node_modules/astro-decap-cms-oauth/src/admin.astro",{"propagation":"none","containsHead":true}],["/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/pages/blog/[slug].astro",{"propagation":"in-tree","containsHead":true}],["/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/pages/blog/index.astro",{"propagation":"in-tree","containsHead":true}],["/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/pages/stg/test/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/blog/[slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/blog/index@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/stg/test/index@_@astro",{"propagation":"in-tree","containsHead":false}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:node_modules/astro-decap-cms-oauth/src/admin@_@astro":"pages/admin.astro.mjs","\u0000@astro-page:src/pages/blog/[slug]@_@astro":"pages/blog/_slug_.astro.mjs","\u0000@astro-page:src/pages/blog/index@_@astro":"pages/blog.astro.mjs","\u0000@astro-page:node_modules/astro-decap-cms-oauth/src/oauth/callback@_@ts":"pages/oauth/callback.astro.mjs","\u0000@astro-page:node_modules/astro-decap-cms-oauth/src/oauth/index@_@ts":"pages/oauth.astro.mjs","\u0000@astro-page:src/pages/stg/test/index@_@astro":"pages/stg/test.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_DHv51Eau.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_Dd0FpZ-L.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/.astro/content-assets.mjs":"chunks/content-assets_DleWbedO.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/.astro/content-modules.mjs":"chunks/content-modules_02NCtSuf.mjs","\u0000astro:data-layer-content":"chunks/_astro_data-layer-content_BBw_67xG.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/content/authors/a.mdx?astroPropagatedAssets":"chunks/a_B9YsEL76.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/content/authors/b.mdx?astroPropagatedAssets":"chunks/b_PYz6Cp2f.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/content/blog/2025-08-25-sample-a.mdx?astroPropagatedAssets":"chunks/2025-08-25-sample-a_DxBFRaVF.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/content/blog/2025-08-25-sample-b.mdx?astroPropagatedAssets":"chunks/2025-08-25-sample-b_2RU1g5J2.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/content/authors/a.mdx":"chunks/a_B_yWpLr-.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/content/authors/b.mdx":"chunks/b_BNc3jmVV.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/content/blog/2025-08-25-sample-a.mdx":"chunks/2025-08-25-sample-a_iEyIrrk_.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/content/blog/2025-08-25-sample-b.mdx":"chunks/2025-08-25-sample-b_DLoXbP3D.mjs","/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/pages/blog/index.astro?astro&type=script&index=0&lang.ts":"_astro/index.astro_astro_type_script_index_0_lang.CyXEwNsY.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/Users/iwata/Documents/workspace/development/WebsiteManagement/website/src/pages/blog/index.astro?astro&type=script&index=0&lang.ts","const f=document.getElementById(\"list\");if(!f)console.error(\"List element not found\");else{let e=function(){const t=s.value?new Date(s.value):null,n=c.value?new Date(c.value):null,u=r.value.trim().toLowerCase();m.forEach(a=>{const L=a.dataset.author,i=new Date(a.dataset.date||\"\"),v=(a.dataset.title+\" \"+a.dataset.tags).toLowerCase();let o=!0;d!==\"ALL\"&&L!==d&&(o=!1),t&&i<t&&(o=!1),n&&i>n&&(o=!1),u&&!v.includes(u)&&(o=!1),a.style.display=o?\"\":\"none\"})};const m=Array.from(f.querySelectorAll(\".item\")),l=document.querySelectorAll(\".author-btn\"),s=document.getElementById(\"fromDate\"),c=document.getElementById(\"toDate\"),y=document.getElementById(\"clearDates\"),r=document.getElementById(\"q\"),E=document.getElementById(\"clearQ\");let d=\"ALL\";l.forEach(t=>{t.addEventListener(\"click\",()=>{d=t.dataset.author||\"ALL\",l.forEach(n=>n.style.fontWeight=n===t?\"700\":\"400\"),e()})}),s.addEventListener(\"change\",e),c.addEventListener(\"change\",e),y?.addEventListener(\"click\",()=>{s.value=\"\",c.value=\"\",e()}),r.addEventListener(\"input\",e),E?.addEventListener(\"click\",()=>{r.value=\"\",e()}),l[0]&&(l[0].style.fontWeight=\"700\"),e()}"]],"assets":["/admin/config.yml","/images/uploads/muu.png","/images/uploads/sickmad.png","/admin/index.html","/blog/index.html","/stg/test/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"po6tzBzY0oBHdCHHDDJVuXyIBids3xm2uMbqcyNvnI8="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
