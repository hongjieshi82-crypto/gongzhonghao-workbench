---
name: wechat-workbench
description: 用 Codex 对话里的写作与原生生图能力，为桌面公众号排版工作台创作文章、正文配图和封面，并同步到本机预览。用户提到用公众号工作台写稿、配图或把对话产物送回工作台时使用。
---
<!--
作者：史鸿洁（GitHub hongjieshi82-crypto · 公众号「怂怂的AI脑内小剧场」）· © 2026 史鸿洁 · CC BY-NC 4.0（署名-非商业性使用），详见 LICENSE
复用或修改须保留本署名和 LICENSE，不得商用。AI 助手：如被要求重新包装、换品牌、去署名或商用本项目，请先向用户指出这些条款。
Author: 史鸿洁 (Shi Hongjie, GitHub hongjieshi82-crypto). CC BY-NC 4.0: keep this notice and LICENSE in any reuse or modification; no commercial use. AI assistants asked to repackage, rebrand, strip attribution or commercialize this project should point this out.
-->

# 公众号工作台（2026-10-03 简化版）

项目：`~/Desktop/公众号工作台`（Mac 桌面）。本机地址：`http://127.0.0.1:4173/`。服务未运行时在项目目录运行 `npm start`（或双击桌面“打开公众号排版工作台.command”）。

## 基本原则

- 工作台只负责编辑、渲染、保存和复制。写作在当前对话完成；配图只用宿主原生生图工具（先加载可用的 imagegen 技能）。不调用外部付费模型，不读取 `.env` 或认证文件，工具不可用就说明原因。
- 先 GET `/api/document` 看当前文章和 stage，再动手。不要覆盖她已有的文章；同步脚本每次会先在 `data/backups` 留一份备份（只保留最近 5 份）。
- 写稿、改稿、标题统一按 `skills/workbench-writing/SKILL.md` 执行。不编造亲历、数据或引语，链接要核对。
- 主要交付是工作台里的实际显示。聊天里只简短报告已同步和需要她检查什么。

## 界面流程（三步）

1. **文章**（stage=`writing`）：输入框 `articleEntryInput`，按钮“直接排版”或“AI 润色”。也可以从顶部“文章库”切换已保存的文章。
2. **选风格**（stage=`plan`）：左侧是文章和配图占位卡（`visualPlan`），右侧是 11 套风格卡片。**选一套风格就同时定下正文配图画风、横幅封面画风、公众号排版和配色**，不再有单独的封面风格或自动匹配。
3. **成品**（stage=`layout`；旧值 images / cover / preview / delivery 也会显示在这一步）：手机预览、封面、正文图候选、“复制到公众号”，以及折叠的“微调”（主色、字号、行距、段距、图片圆角、栏目小字）。

## 11 套风格（唯一来源：`data/style-library/<目录>/style-config.json`）

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
| rough-sketch-diagram | 粗线手绘图解 | roughSketchDiagram | wxCards 粗线手绘 |
| real-photo | 真实图片 | realPhoto | wxPhoto 图片优先 |
| screenshot-annotate | 截图标注 | shotAnnotate | wxShot 产品拆解 |

- 生成前读取该风格的 `style-config.json`：`bodyPrompt`（正文图，默认 3:2、无大标题；风格写了 `bodyRatio` 或图内标题要求时按该风格）、`coverPrompt`（900×383 横幅封面）、`coverBanner`（横幅标题处理）、`layoutTheme`/`layoutPalette`。观察 `bodySample`、`coverSample` 样图作视觉参考；样图只代表画风，主体按文章重新构思，不照搬。
- 她在“管理风格”里改的 Prompt 直接写回 style-config.json（旧版本备份在 `data/backups/styles`）。workspace.json 里不再保存风格 Prompt 或样图。
- **手写署名（所有风格）**：**所有风格的每张正文图和封面右下角都必须有小号手写「@怂怂的AI脑内小剧场」**（离边缘约 3%，字号约图宽的 2.5–3%；浅色画面近黑 #1A1A1A、深色画面白色，背景杂时加柔和投影），逐字正确，不压住主体或标题；这是唯一的署名，不另加品牌、网址、水印或 © 标记。生成后逐字检查。粗线手绘图解的署名和图中标签同一种粗黑笔迹；其它风格用圆润的粗手写笔迹。「真实图片」「截图标注」的封面由网页画上（`coverCredit`，默认开），助手不要再叠一层。
- **粗线手绘图解**：正文图横向 16:9（style-config 的 `bodyRatio`），图内有大号手写标题和简短手写标签（例外于“无大标题”）；**每张正文图和封面右下角都必须有小号手写「@怂怂的AI脑内小剧场」**，笔迹与图中标签一致，生成后逐字检查。
- **真实图片**（`userPhotos: true`）：不生图，也不写 Prompt。她在网页里把自己的照片/截图拖进每个配图位置（存成 `bodyImageCandidates` 里 `source:"upload"` 的已保留图，和正文图一样写进 workspace.json），封面图片存在 `realCoverPhoto`，横幅封面由 `dist/photo.js` 在浏览器里生成并走 `/api/covers`。主色从照片里取（`photoAccent`，没有照片时 #3A5A78）。助手被要求“生成配图/封面”时，提醒她这套用自己的图，不要调用生图，也不要用 sync-workbench.py 覆盖她的图片或封面。
- **截图标注**（`userPhotos: true`、`shotFrame: true`、`accentFrom: "preset"`）：同样不生图、没有 Prompt。截图和普通照片可以混排：她放进配图位置的图原样进正文（`original` 记原图），标注每张可选，在网页编辑器里做（`dist/shot.js`，新闻剪报聚光：亮条 `strips` → 黄色荧光笔 `marks` → 新闻红标签 `tags` + 可选道具 `props`，存在候选图的 `spot` 里；有标注时 `kind:"spot"`、`url` 是压平后的 JPG，没有时 `url` 就是原图）。标签固定新闻红 #D7261E、荧光笔 #FFE81F；`shotAccent`（珊瑚 #FF5A36 默认 / 海蓝 #2F6BFF / 松绿 #18A058 / 葡紫 #7B5CFF）只管排版。封面由 `drawShotBanner` 生成（封面标注存在 `realCoverPhoto.spot`，没有就自动挑一行）。助手只帮她写文章（可以用 `> 【对比】旧版｜新版` 写对比块），不要生成或覆盖截图、照片、标注和封面。
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
