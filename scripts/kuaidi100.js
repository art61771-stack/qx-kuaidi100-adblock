/* 快递100微信小程序广告配置清理。无上传、无日志、无外部请求。 */
(function () {
  const original = $response.body;
  try {
    const rawUrl = $request.url;
    const isDict = /^https:\/\/p\.kuaidi100\.com\/apicenter\/kdmkt\.do\?/.test(rawUrl);
    const isAds = /^https:\/\/p\.kuaidi100\.com\/advertisement\/ad\/multi\/terminal(?:\/config)?(?:\?|$)/.test(rawUrl);
    const isSDK = /^https:\/\/ad\.api\.open\.jihuoniao\.com\/api\/jihuoniao\/v1\/ad\/ad_config(?:\?|$)/.test(rawUrl);
    const isDictEndpoint = /^https:\/\/p\.kuaidi100\.com\/apicenter\/kdmkt\.do(?:\?|$)/.test(rawUrl);
    if (!isDictEndpoint && !isAds && !isSDK) { $done({}); return; }
    function param(name) {
      const match = rawUrl.match(new RegExp("[?&]" + name + "=([^&]*)"));
      return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
    }
    const method = param("method");
    const postData = $request.body || "";
    const postMethod = postData.match(/(?:^|&)method=([^&]*)/);
    const effectiveMethod = method || (postMethod ? decodeURIComponent(postMethod[1]) : "");
    const obj = JSON.parse(original);
    if (isSDK) {
      if (obj.code === 0 && obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
        obj.data.jihuoniao_allow = 0;
        $done({ body: JSON.stringify(obj) }); return;
      }
      $done({}); return;
    }
    if (String(obj.status) !== "200") { $done({}); return; }
    if (isAds) {
      // 真实的无广告响应是 data.list=[]，保留 message/status 的原始类型。
      if (obj.data && Array.isArray(obj.data.list)) {
        obj.data.list = [];
        $done({ body: JSON.stringify(obj) }); return;
      }
      $done({}); return;
    }
    let changed = false;
    // 同一字典接口也承载快递公司名单等功能，只删除明确属于广告的字典项。
    if ((method === "dictItemsByCode" || effectiveMethod === "dictItemsByCode" || (isDictEndpoint && param("dictCode") === "wx_ad_config")) && Array.isArray(obj.data)) {
      const clean = obj.data.filter(item => !(item && item.dictCode === "wx_ad_config"));
      if (clean.length !== obj.data.length) { obj.data = clean; changed = true; }
    }
    // 积分抽奖悬浮入口；保留状态码及成功响应结构。
    if (method === "dictItemDescByCodeAndVal" &&
        param("dictCode") === "COMMON_CONFIG" &&
        param("dictVal") === "index_activity_float_banner") {
      if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
        ["icon", "path", "iOSPath", "androidPath"].forEach(key => { obj.data[key] = ""; });
        changed = true;
      }
    }
    $done(changed ? { body: JSON.stringify(obj) } : {});
  } catch (_) { $done({}); }
})();
