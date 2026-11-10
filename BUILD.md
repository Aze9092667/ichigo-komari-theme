# 定制版维护

这是 Reze 1.2.2 已安装生产资源及独立回程扩展，并非原版完整开发源码。原版安装包另外保留备份。

使用 Node 24 与 Python 3。首次安装执行 `npm ci`，然后依次执行 `npm test`、`npm run check`、`npm run build`、`npm run package`。安装包生成到 `release/Ichigo-Komari-Theme.zip`。脚本只打包 `komari-theme.json`、`preview.png`、`TRANSIT-LICENSE.txt`、`THIRD_PARTY_NOTICES.md` 和 `dist/`，不会包含源码目录、依赖或本机工作文件。

扩展入口 `src/index.ts`，链路数据和权限控制 `src/service.ts`，样式 `aze-route.css`。扩展复用原主题 Vue 运行时，避免加载两个 Vue。原卡片的生产渲染函数已接入扩展。主题升级或修改入口文件时，应同步更换所有 JS/CSS 文件名和引用，避免缓存中的旧模块与新入口混用。

标题使用 div 而非 header，避免继承原主题全局 header 深色背景。桌面宽度 ≥1200px 时，首页卡片网格固定四列；卡片内部文字、间距与图表保持原比例，所有卡片统一 560px，回程/国内链路槽统一 132px。四列覆盖规则仅位于该桌面断点内，小于 1200px 时保持原有响应式排版、字号和尺寸。

采集插件和助手基于 Transit 项目，保留其 MIT 许可。国内链路为后台已配置拨测任务的真实最近一小时摘要；未知、失败与无样本保持明确占位。节点分类依据地区代码；独立标签 `route-probe:paused` 可暂停该节点采集。结果保存在当前主题设置中，主题不会修改节点标签。

`src/addressFamilies.ts` 根据节点实际上报的有效地址生成 IPv4/IPv6 徽标，无地址时不显示，不将标记视为公网连通性检测。只有有效管理员登录且当前主题匹配时才同步协议摘要；同步前使用匿名 `/api/nodes` 名单限定公开节点 UUID，仅保存 `ipv4`/`ipv6` 布尔值，剔除隐藏节点，不保存或展示实际 IP。未登录访客只读取公开摘要。此设置写入与回程结果共用串行合并流程，以保留其他主题设置；`test-address-families.mjs` 覆盖地址校验、双栈显示、匿名名单和权限保护。

Ichigo 定制固定使用深色模式，页头和微调中已移除明暗切换。更新生产 chunk 后统一版本化全部 JS/CSS，再运行打包脚本同步 ichigo-palette.css。主题 HTML 不得包含服务端注入的 unlock-test 或 net-forecast 插件标签/内联脚本，否则会创建两套实例，引起闪烁与重复刷新。首页与详情 PingChart 的任务显示数组保留后台配置顺序，数据仍按原 task.id 关联；不包含专属测速名称或机器名称规则。

GitHub Actions 会在主分支、拉取请求及手动运行时验证构建并上传安装包 artifact。推送与主题版本一致的 `v*` 标签会创建公开 Release。手动运行默认不发布；将可选 `publish` 设为 `true` 时，始终从当前 `main` 检出构建，校验 manifest 与 package 版本，按实际构建提交创建缺失标签并幂等上传附件。已有标签指向其他提交时停止发布，避免把同版本资源混到不同源码上。

公开版的 `pandaOpsRouteProbeResults.default` 和 `azeNodeAddressFamilies.default` 必须为 `{}`。打包脚本会拒绝包含节点回程快照或协议摘要的非空默认设置。运行中的站点结果仍保存在各自 Komari 实例的主题设置中。
