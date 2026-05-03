// ======== 🔥 ENHANCED CORE PATCH (FULL) ========

// ===== Dock 注入 =====
function injectDock(html){
return html.replace("</body>",`
<div id="cf-dock">
  <div onclick="location.reload()">🔄</div>
  <div onclick="localStorage.clear()">🧹</div>
  <div onclick="navigator.clipboard.writeText(location.href)">📋</div>
</div>

<style>
#cf-dock{
position:fixed;
bottom:20px;
left:50%;
transform:translateX(-50%);
background:rgba(0,0,0,0.85);
padding:10px 16px;
border-radius:12px;
display:flex;
gap:12px;
z-index:9999;
}
#cf-dock div{
color:#fff;
cursor:pointer;
}
</style>

</body>`)
}


// ===== 智能推流（核心）=====
async function smartFetch(targets, request){

const ip = request.headers.get("cf-connecting-ip") || "default"

globalThis.routeCache = globalThis.routeCache || {}

if(globalThis.routeCache[ip]){
  return fetch(globalThis.routeCache[ip],request)
}

for(let target of targets){
  try{
    let url=new URL(target)

    // ✅ 8443修复
    if(url.port==="8443"){
      url.protocol="https:"
    }

    const controller=new AbortController()
    const timeout=setTimeout(()=>controller.abort(),8000)

    let res=await fetch(url.toString(),{
      method:request.method,
      headers:request.headers,
      body:request.body,
      signal:controller.signal,
      cf:{
        tlsVerify:false,
        cacheTtl:0
      }
    })

    clearTimeout(timeout)

    if(res.status<500){
      globalThis.routeCache[ip]=url.toString()
      return res
    }

  }catch(e){}
}

return new Response("All backend failed",{status:502})
}


// ===== Hook 原 fetch（关键）=====
async function handleProxy(request, targets){
return await smartFetch(targets, request)
}

// 插入 Hook 逻辑
// 替换原始的 fetch(targetUrl, requestInit) 为：return await handleProxy(request, targets)

// 插入 HTML dock 的相关内容
// 替换返回 HTML 的地方，将 return new Response(html) 替换为：
// html = injectDock(html);
// return new Response(html, { headers: {"content-type": "text/html"} });