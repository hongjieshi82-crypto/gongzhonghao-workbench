---
name: wechat-workbench
description: 用 Codex 对话里的写作与原生生图能力，为桌面公众号排版工作台创作文章、正文配图和封面，并同步到本机预览。用户提到用公众号工作台写稿、配图或把对话产物送回工作台时使用。
---

# 公众号工作台（2026-10-03 简化版）

项目：`~/Desktop/公众号工作台`（Mac 桌面）。本机地址：`http://127.0.0.1:4173/`。服务未运行时在项目目录运行 `npm start`（或双击桌面“打开公众号排版工作台.command”）。

## 基本原则

- 工作台只负责编辑、渲染、保存和复制。写作在当前对话完成；配图只用宿主原生生图工具（先加载可用的 imagegen 技能）。不调用外部付费模型，不读取 `.env` 或认证文件，工具不可用就说明原因。
- 先 GET `/api/document` 看当前文章和 stage，再动手。不要覆盖她已有的文章；同步脚本每次会先在 `data/backups` 留一份备份（只保留最近 5 份）。
- 写稿、改稿、标题统一按 `skills/workbench-writing/SKILL.md` 执行。不编造亲历、数据或引语，链接要核对。
- 主要交付是工作台里的实际显示。聊天里只简短报告已同步和需要她检查什么。

## 界面流程（三步）

1. **文章**（stage=`writing`）：输入框 `articleEntryInput`，按钮“直接排版”或“AI 润色”。也可以从顶部“文章库”切换已保存的文章。
2. **选风格**（stage=`plan`）：左侧是文章和配图占位卡（`visualPlan`），右侧是 8 套风格卡片。**选一套风格就同时定下正文配图画风、横幅封面画风、公众号排版和配色**，不再有单独的封面风格或自动匹配。
3. **成品**（stage=`layout`；旧值 images / cover / preview / delivery 也会显示在这一步）：手机预览、封面、正文图候选、“复制到公众号”，以及折叠的“微调”（主色、字号、行距、段距、图片圆角、栏目小字）。

## 8 套风格（唯一来源：`data/style-library/<目录>/style-config.json`）

| 目录 | 名称（state.imageStyle） | coverStyle | 绑定排版 |
|---|---|---|---|
| vintage-paper | 复古纸艺拼贴 | vintagePaper | wxHeadline 复古报刊 |
| neon-metal | 黑金属荧光科技 | neonMetal | wxDataReport 金属报告 |
| retro-pop-comic | 复古波普漫画 | retroPopComic | wxCards 波普漫画格 |
| dynamic-narrative-comic | 动感叙事漫画 | dynamicNarrative | wxMagazine 动感杂志 |
| warm-handdrawn-info | 暖色手绘信息图 | warmHanddrawnInfo | wxJournal 暖色手账 |
| neon-scifi-cartoon | 霓虹科幻卡通 | neonScifiCartoon | wxCards 霓虹卡片 |
| neon-portrait | 荧光科技人像 | neonPortrait | wxBigType 荧光大字 |
| pop-portrait | 波普拼贴人像 | popPortrait | wxJournal 波普拼贴 |

- 生成前读取该风格的 `style-config.json`：`bodyPrompt`（正文图，3:2，无大标题）、`coverPrompt`（900×383 横幅封面）、`coverBanner`（横幅标题处理）、`layoutTheme`/`layoutPalette`。观察 `bodySample`、`coverSample` 样图作视觉参考；样图只代表画风，主体按文章重新构思，不照搬。
- 她在“管理风格”里改的 Prompt 直接写回 style-config.json（旧版本备份在 `data/backups/styles`）。workspace.json 里不再保存风格 Prompt 或样图。
- **霓虹科幻卡通**：默认用工作台原创角色（宇航员小孩、牛仔帽机器人、红辫子女孩）。`cartoonCharacters` 有内容时按她的说明设计，但只画原创角色，不画任何已有动画、漫画、游戏或品牌角色。不用先问她角色。
- **两种人像风格**：读取 `portraitReference` 与 `portraitPersonLabel`。人物是作者本人（标签空或写“我/作者本人”）时按下面的作者档案；用她上传的照片时必须导出并观察原图作人脸参考。没有照片就先请她上传，不用样图人像或虚构脸替代。

## 作者本人入画

档案：`data/style-library/_owner/owner-profile.md`（机器可读 `owner-profile.json`，参考照片 `_owner/refs/ref-1～6.jpg`，ref-1 为主）。人像风格里人物是作者本人时，必须读档案和 refs，用 promptZh/promptEn 锁定脸和发型；其他风格只在 `state.includeOwner=true` 时把她画进去，卡通、漫画、插画类用 promptCartoonZh/promptCartoonEn。照片只取脸和发型，不照搬姿势、衣服、道具、背景或构图；整组同一张脸，每张只出现一次，图中不写名字。生成后对照 ref-1 检查。`_owner` 是私人照片，不放进开源包或公开链接。

## 配图方案（visualPlan）

- 每项 `{id, after, reason, scene}`，可带 `anchorText`（目标段落纯文本）与 `anchorIndex`（预览顶层块序号）；after 为精确章节标题或空字符串。编号由锚点顺序决定，不存固定编号。
- 先通读全文再规划。默认 3～6 张，封面另计，按信息密度决定，不每章强配，不用装饰图凑数。每张写清对象、关系和它帮读者理解哪一点。
- 她在页面上新增的占位带 `needsContextAnalysis=true`：先分析锚点前后文，更新 scene/reason，清除标记，设 `visualPlanConfirmed=false` 让她确认，不直接生成。
- 修改方案后更新 `syncRevision`，stage=`plan`。

## 生成与同步（scripts/sync-workbench.py，只操作本机工作台）

- 文章：`python3 scripts/sync-workbench.py draft /绝对路径/文章.md`（第一行 `# 标题`，同步后进入第二步）。只在她要求写新稿或替换正文时使用。
- 正文图候选：`python3 scripts/sync-workbench.py candidate 图片 --slot-id <visualPlan 的 id> --alt "图的具体内容"` → 进 `bodyImageCandidates`，她在第三步点“采用”后按锚点插入正文。单张修改只重做那一张。
- 直接插图（少用）：`python3 scripts/sync-workbench.py image 图片 --after "章节标题" --alt "描述"`。
- 封面：先做好含准确完整标题的约 2.35:1 横幅，再 `python3 scripts/sync-workbench.py cover /绝对路径/封面.png`（需要 Pillow）。脚本会导出 wide/square/portrait/proof/source 五份，只验收横幅。
- 脚本会写 `syncRevision`，打开的页面每 2 秒检查并自动刷新内容。
- `imageGenerationPending` / `coverGenerationPending` 只在原生工具真正运行时设为 true，结束或失败清除；复制指令不等于已经开始生成。

## 封面

按 `skills/workbench-cover/SKILL.md` 和 `skills/workbench-cover/references/banner-title.md` 执行：标题直接用文章完整标题，与画面在同一张 900×383 横幅里一体设计，不预留方图安全区，缩到约 300px 宽仍可读。

## 交付

“复制到公众号”复制的是带内联样式的富文本（与排版预览一致），她粘贴到公众号后台。Markdown 只是源稿，不能说 Markdown 带走了排版。最终发布由她在公众号后台完成。
