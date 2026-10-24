# 快递100微信小程序 · Quantumult X 去广告

基于 2026-10-08、2026-10-16 两份抓包编写，2026-10-24 发布。

## 添加方法

1. Quantumult X → 重写 → 引用 → 添加：
   `https://raw.githubusercontent.com/art61771-stack/qx-kuaidi100-adblock/main/kuaidi100.snippet`
2. Quantumult X → 分流 → 引用 → 添加（推荐，与重写配合）：
   `https://raw.githubusercontent.com/art61771-stack/qx-kuaidi100-adblock/main/kuaidi100.list`
   保留资源内的 reject 策略，放在可能匹配该域名的 DIRECT/PROXY 通用规则之前。
3. 打开重写与 MitM，确认 QX 证书已经安装并在 iOS 中完全信任。确认上述重写的 3 个 hostname 已合并到 MitM 域名列表；手动编辑时保留原有域名。
4. 彻底关闭快递100小程序再重新打开。若仍沿用旧广告配置，在微信最近使用的小程序列表移除快递100后重新进入。已有其他快递100重写时先停用，以免冲突。

## 覆盖范围

- 清理 `kdmkt.do?method=dictItemsByCode` 响应中 `dictCode=wx_ad_config` 的广告位：开屏、首页信息流、查件详情 A/B、专属寄件、专属订单详情、寄件成功插屏、我的页面横幅。
- 拦截 `/advertisement/ad/` 广告请求与 `ad.api.open.jihuoniao.com` 极火鸟广告 SDK。
- 清空积分抽奖悬浮入口配置并拦截其图标。
- 保留字典接口中的非广告项、寄件服务菜单、正常查询、登录、订单、支付及优惠券接口。

抓包中 `/advertisement/ad/multi/terminal` 和 `/config` 已返回 404，但广告字典仍成功下发 8 个广告位，并另有极火鸟 SDK 请求。因此仅屏蔽前者不足以覆盖这两份抓包。

`cdn.kuaidi100.com/images/open/appads/` 同时承载正常寄件功能图标，不能整目录屏蔽。微信通用域名亦未屏蔽。小程序本地静态组件或已经缓存的广告外框，网络规则无法保证移除。

## 验证与边界

本地使用两份 HAR 的原始响应离线回放，并检查广告位清理、其他响应保持原样、正则命中及 SDK 拦截。测试脚本为 `checks/replay.js`（本地传入 HAR 路径运行，HAR 不上传）。尚未在用户微信/QX 真机验证，不能保证未来版本、未抓到的页面或微信原生广告通道全部覆盖。安装后应检查开屏、首页、查件详情、我的页面，以及查询/寄件是否正常。

响应脚本仅在本地处理 JSON，不上传数据、不打印日志、不发外部请求。仓库不包含 HAR、Cookie、账号、运单或登录凭证。
