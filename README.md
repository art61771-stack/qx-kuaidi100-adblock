# 快递100微信小程序 · Quantumult X 去广告

基于四份 HAR（2026-10-08、10-16、10-24 两份）编写。当前 v3 使用 QX 官方支持的 `jsonjq-response-body` 内置重写，不再依赖远程 JavaScript 下载、缓存或执行。官方语法依据：`crossutility/Quantumult-X` 的 `sample.conf`。

## 添加方法

1. Quantumult X → 重写 → 引用 → 添加：
   `https://raw.githubusercontent.com/art61771-stack/qx-kuaidi100-adblock/main/kuaidi100.snippet`
2. 如曾订阅 `kuaidi100.list`，请在 QX 中删除这条分流引用，或刷新它以取消旧版极火鸟拦截；现只需重写规则。检查是否还有手动添加的 `ad.api.open.jihuoniao.com` 拦截规则。
3. 打开重写与 MitM，确认 QX 证书已经安装并在 iOS 中完全信任。确认上述重写的 `p.kuaidi100.com`、`cdn.kuaidi100.com`、`ad.api.open.jihuoniao.com` 已合并到 MitM 域名列表；手动编辑时保留原有域名。更新重写资源后，如 QX 提供脚本更新入口也刷新脚本。
4. 彻底关闭快递100小程序再重新打开。若仍沿用旧广告配置，在微信最近使用的小程序列表移除快递100后重新进入。已有其他快递100重写时先停用，以免冲突。

## 覆盖范围

- 清理 `kdmkt.do?method=dictItemsByCode` 响应中 `dictCode=wx_ad_config` 的广告位：开屏、首页信息流、查件详情 A/B、专属寄件、专属订单详情、寄件成功插屏、我的页面横幅。
- `/advertisement/ad/multi/terminal` 及 `/config` 成功响应中，如存在 `data.list` 数组则清空；保留 `status`（数字或字符串）与其他字段，非 JSON/失败响应保持原样。
- 极火鸟 `/api/jihuoniao/v1/ad/ad_config` 成功响应中将 `data.jihuoniao_allow` 改为 `0`，保留其余字段。该开关效果仍需真机确认。
- 积分抽奖悬浮入口保留对象结构，清空 `icon/path/iOSPath/androidPath` 并拦截旧图标，避免返回 null 造成客户端读取错误。
- 保留字典接口中的非广告项、寄件服务菜单、正常查询、登录、订单、支付及优惠券接口。

旧两份抓包中的广告接口均为 404，但 10/24 新抓包显示接口实际可返回 200：极火鸟下发 `jihuoniao_allow=1` 和 splash 配置，自有广告接口下发优惠券推广列表。v2 按这些真实结构关闭开关与清空列表，替代初版空 JSON 拦截及上一版完全放行。

10/24 11:01 的 QX 抓包重新记录到完整的 8 个广告字典项，以及广告接口/SDK 的空 404。HAR 无法单独证明这些是重写前记录还是规则未生效；不得据此断言脚本未运行。v3 将关键处理移至 QX 内置 jq，排除远程脚本获取/缓存依赖。请在重写资源预览中确认有 `去广告 v3`、`jsonjq-response-body`，停用重复的旧规则，并开启三个目标域名的 MitM。已有客户端广告仍可能缓存；移除最近使用中的小程序再进入。截图横向新人优惠券条的配置尚未定位，不通过清空业务优惠券接口猜测移除。

`cdn.kuaidi100.com/images/open/appads/` 同时承载正常寄件功能图标，不能整目录屏蔽。微信通用域名亦未屏蔽。小程序本地静态组件或已经缓存的广告外框，网络规则无法保证移除。

## 验证与边界

`checks/replay-v3.py` 使用本地 jq 执行当前订阅内的原始表达式，对四份 HAR 共 1007 条记录回放：5 个广告字典、4 个悬浮入口、1 个 SDK 配置、3 个推广列表均符合预期，1 个悬浮图标命中；940 条记录不匹配规则，53 个目标请求为空/非 JSON。另验证失败状态与 null 数据不变。离线 jq 通过不等于 QX 真机验收，尤其不能保证目标请求空响应时的 QX 行为。旧 JS 回放文件仅作版本历史，已由 v3 回放替代。HAR 不上传。游戏广告及启动提示仍待更新后的真机确认。

响应脚本仅在本地处理 JSON，不上传数据、不打印日志、不发外部请求。仓库不包含 HAR、Cookie、账号、运单或登录凭证。
