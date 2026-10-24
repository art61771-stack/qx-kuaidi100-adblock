/* 快递100微信小程序广告配置清理。无上传、无日志、无外部请求。 */
(function () {
  const original = $response.body;
  try {
    const rawUrl = $request.url;
    if (!/^https:\/\/p\.kuaidi100\.com\/apicenter\/kdmkt\.do\?/.test(rawUrl)) {
      $done({}); return;
    }
    function param(name) {
      const match = rawUrl.match(new RegExp("[?&]" + name + "=([^&]*)"));
      return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
    }
    const method = param("method");
    const obj = JSON.parse(original);
    if (obj.status !== 200) { $done({}); return; }
    let changed = false;
    // 同一字典接口也承载快递公司名单等功能，只删除明确属于广告的字典项。
    if (method === "dictItemsByCode" && Array.isArray(obj.data)) {
      const clean = obj.data.filter(item => !(item && item.dictCode === "wx_ad_config"));
      if (clean.length !== obj.data.length) { obj.data = clean; changed = true; }
    }
    // 积分抽奖悬浮入口；保留状态码及成功响应结构。
    if (method === "dictItemDescByCodeAndVal" &&
        param("dictCode") === "COMMON_CONFIG" &&
        param("dictVal") === "index_activity_float_banner") {
      obj.data = null; changed = true;
    }
    $done(changed ? { body: JSON.stringify(obj) } : {});
  } catch (_) { $done({}); }
})();
