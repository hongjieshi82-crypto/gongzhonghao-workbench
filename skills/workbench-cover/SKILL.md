---
name: workbench-cover
description: 为公众号工作台设计与正文配图一致的完整封面，处理文章标题排印、构图与 900×383 横幅一体化标题，并同步回本机工作台。用于工作台封面设计和修改，不负责正文写作或发布。
---

# 工作台封面设计

## 读什么

1. GET `http://127.0.0.1:4173/api/document`：当前标题、`imageStyle`、`coverStyle`、已采用的正文图、`coverFeedback`（她的修改意见）、`includeOwner`、`cartoonCharacters`、`portraitReference`。
2. 所选风格的 `data/style-library/<目录>/style-config.json`：`coverPrompt` 与 `coverBanner`（字体、填色、描边、容器、光效），观察 `coverSample` 样图。9 套风格与目录对照见 `skills/wechat-workbench/SKILL.md`。
3. `references/banner-title.md`：横幅一体化标题规范和各风格的标题处理。
4. 正文视觉延续：`skills/wechat-workbench/references/cover-art-direction.md`。先观察已采用的正文图，选一两张作为原生生图参考；封面不换媒介（摄影继续摄影，手绘继续手绘）。
5. 需要画作者本人时读 `data/style-library/_owner/owner-profile.md` 与 refs（规则同 wechat-workbench）。

## 怎么设计

- 完整文章标题逐字继承，不删字、不加标语或英文。按语义分引入小字和主标题，最多强调一两处，长标题靠换行和字号解决。
- 标题和画面是同一张 900×383 横幅：共用光源、透视和动势，至少一种咬合方式（面板边缘渐隐进场景、光轨从标题连到主体、主体局部压在面板前、标题投影落在场景上）。禁止“左边纯色写字、右边放图”的分栏，不预留或居中 1:1 方图安全区。
- 标题字体、填色、容器按该风格的 `coverBanner` 执行，并与绑定的公众号排版标题一致。
- 边距：第一行文字距顶部至少约 32px，文字离左右边缘至少约 32px，标题组与主体之间有清楚间隔。缩到约 300px 宽仍能读出主标题。
- 主体来自文章本身；不固定样图构图，不用无关装饰或假人像。不冒充实拍、采访或真实截图。
- 霓虹科幻卡通只画原创角色（默认宇航员小孩、牛仔帽机器人、红辫子女孩），不画任何已有 IP 角色。

## 执行与交付

- 只用宿主原生生图，不读密钥、不调付费 API。提示词和版本保存到项目 `data/covers`。
- 生成后看实际像素：标题是否准确、边距、缩略图可读性、图文是否一体。不合格就局部修正排印，不整张推倒。
- 做成约 2.35:1 横版后同步：`python3 scripts/sync-workbench.py cover /绝对路径/封面.png`。方图和竖图只是脚本顺带导出的附件，不作验收。
- 她否定的方向不覆盖已确认设计，回到正文视觉重新构思，不靠换颜色反复同一构图。
- 工作台显示是主要交付；聊天只简短报告结果和需要她检查的地方。
