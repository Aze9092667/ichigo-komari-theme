# Ichigo · BLEACH — Komari 主题

为 Komari 定制的 BLEACH 风格监控主题。固定深色界面，使用蓝灰玻璃、橙金点缀和骷髅牌图标。

![主题预览](preview.png)

## 安装

1. 打开 [Releases](https://github.com/Aze9092667/ichigo-komari-theme/releases/latest)。
2. 下载附件 **`Ichigo-Komari-Theme.zip`**。
3. 在 Komari 后台 → 主题管理 → 上传主题，上传 ZIP 后启用。

也可在支持 URL 导入的 Komari 后台使用以下地址：

```text
https://github.com/Aze9092667/ichigo-komari-theme/releases/latest/download/Ichigo-Komari-Theme.zip
```

请下载 Release 附件；GitHub 自动生成的 Source code ZIP 是维护源码，不是直接安装包。兼容性已在 Komari 1.6.1 上验证。

## 功能

- 一护主视觉、透明 Q 版人物、BLEACH 矢量标志及统一骷髅牌图标。
- 仅深色模式；可在「微调」中调整玻璃透明度、模糊和背景显影。
- 服务器卡片固定 560px，回程或本地链路区域固定 132px。
- 境外节点展示三网回程证据、等级及采集时间；国内节点展示真实拨测摘要。
- 延迟目标及显示顺序遵循各自 Komari 后台配置，公开包不包含预设测速节点。
- 搜索、卡片/列表视图、服务器详情和历史图表。
- 流量预测、流媒体解锁浮窗采用纯色蓝灰外层与玻璃内卡片，适配窄屏。

## 回程与插件

回程扩展依赖单独安装的 **Transit Route Probe** 插件及节点助手。未安装时保留「等待采集」状态，不会编造线路或延迟。采集失败时保留上次成功结果。管理操作需要有效管理员登录。

NetForecast 和 UnlockTest 是独立插件。主题不包含它们的安装包或重复注入代码；仅在已安装时提供样式适配。主题不会开启节点远控，也不会修改 SSH 权限。

节点的国内或境外分类以地区代码为准。如需暂停某个节点的回程采集，可为它添加独立标签 `route-probe:paused`；不按机器名称匹配。延迟任务由用户在自己的 Komari 后台配置。结果以当前 Komari 主题设置为准；公开包没有预置个人测速节点、机器名称规则、节点 UUID、回程快照或登录凭据。

## 开发与打包

需要 Node.js 24、npm 和 Python 3。

```sh
npm ci
npm test
npm run check
npm run build
npm run package
```

安装包输出到 `release/Ichigo-Komari-Theme.zip`。推送与主题版本一致的 `v*` 标签可通过 GitHub Actions 构建并创建 Release。

手动运行工作流默认只生成构建产物；勾选 `publish` 才会发布。手动运行始终构建当时 `main` 分支的提交，校验主题与 package 版本一致，再创建缺失的版本标签并上传 Release 附件。已存在的同提交 Release 会覆盖更新同名附件；若标签已指向其他提交，必须先提升版本号。

本仓库包含 Reze 1.2.2 的生产资源和独立 TypeScript 回程扩展，**不包含原主题完整 Vue 开发源码**。入口 chunk 已接入扩展；构建只重建该扩展及定制 CSS。修改原生产 chunk 后，应统一更新全部 JS/CSS 文件名和引用，避免混用缓存。维护说明见 [BUILD.md](BUILD.md)。

主题内部标识仍为 `Reze-Route`，用于保持已有 Komari 配置和回程结果兼容。

## 来源与声明

保留 Komari、原主题及 Transit 的作者信息。第三方素材与上游代码遵循各自适用条款，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 [TRANSIT-LICENSE.txt](TRANSIT-LICENSE.txt)。
