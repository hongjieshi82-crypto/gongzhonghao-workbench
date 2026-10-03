# 公众号工作台

作者：史鸿洁

在本机运行的微信公众号排版工作台。三步出稿：**文章 → 选一套风格 → 手机预览并复制到公众号**。

- 11 套风格，每套把正文配图画风、900×383 横幅封面、公众号排版主题和配色绑在一起（配置在 `data/style-library/<风格>/style-config.json`）。
- 排版引擎（`dist/wx-layouts.js`）会把文章渲染成带内联样式的 HTML。“复制到公众号”把它作为富文本放进剪贴板，可以直接粘贴到公众号后台。
- 写作与生图不在网页里调用任何付费 API。网页按钮只复制指令，交给本机 Codex 对话（`skills/` 下的三个 Skill）完成，再由 `scripts/sync-workbench.py` 同步回工作台。

## 风格

| 风格 | 公众号排版 | 目录 |
|---|---|---|
| 复古纸艺拼贴 | 复古报刊 | `vintage-paper` |
| 黑金属荧光科技 | 金属报告 | `neon-metal` |
| 复古波普漫画 | 波普漫画格 | `retro-pop-comic` |
| 动感叙事漫画 | 动感杂志 | `dynamic-narrative-comic` |
| 暖色手绘信息图 | 暖色手账 | `warm-handdrawn-info` |
| 霓虹科幻卡通 | 霓虹卡片 | `neon-scifi-cartoon` |
| 荧光科技人像 | 荧光大字 | `neon-portrait` |
| 波普拼贴人像 | 波普拼贴 | `pop-portrait` |
| 粗线手绘图解 | 粗线手绘 | `rough-sketch-diagram` |
| 真实图片 | 图片优先 | `real-photo` |
| 截图标注 | 产品拆解 | `screenshot-annotate` |

粗线手绘图解：奶油底、粗黑手绘线、粉彩圆角卡（天蓝/薄荷/淡紫/蜜桃/奶黄），正文图 16:9；每张图右下角带手写「@怂怂的AI脑内小剧场」。

真实图片：不生图，用你自己的照片和截图。在 ② 里把图片拖进每个配图位置、再放一张封面图片；排版是纯白、通栏照片、细线、编号小标题，图片下面不加任何说明；主色从照片里自动取（没有照片时 #3A5A78）；横幅封面在浏览器里用 canvas 生成（照片铺满 900×383，柔和渐变压暗，标题分层叠在照片上），和其它封面一样“下载封面”。图片跟正文图一样存在 `data/` 里，不进 git。

截图标注：给 AI 产品拆解用，同样不生图，用你自己的产品截图。截图放进配图位置后自动套上浅色浏览器外框（竖图是手机外框），底色 #F5F6F8；点「标注」在浏览器里框出 1–3 处重点（矩形或椭圆），每处自动配一个 2–3 倍放大镜头、连线和 ①②③ 胶囊标签，放大框可以拖，能撤销、能重新编辑，保存时压平成 PNG，原图另存一份。主色一个，珊瑚 #FF5A36（默认）/ 海蓝 / 松绿 / 葡紫 任选，标注和排版一起换。排版「产品拆解」：「01 / 功能点」编号小标题、一句话框、TIP 提示框、马克笔下划线、`> 【对比】旧版｜新版` 变成左右对比块，图片下面不加说明。横幅封面在浏览器里生成：截图带外框斜放在右侧，一处放大镜头冲出画框，标题分层大字在左边。

## 启动

需要 Node.js 18+（无第三方依赖）。

```bash
npm start            # 或双击 打开工作台.command
# 打开 http://127.0.0.1:4173/
```

更新代码后浏览器里按 Cmd+Shift+R 强制刷新。

## 同步脚本（给 Codex 用）

```bash
python3 scripts/sync-workbench.py draft 文章.md                       # 写入新文章（会替换当前正文）
python3 scripts/sync-workbench.py candidate 图.png --slot-id <配图位id> # 正文图候选
python3 scripts/sync-workbench.py cover 封面.png                       # 2.35:1 横幅封面，需要 Pillow
```

每次同步前会在 `data/backups/` 留一份备份，只保留最近 5 份。

## 目录

| 路径 | 内容 |
|---|---|
| `server.js` | 本机服务：`/api/document`、`/api/covers`、`/api/styles`、`/api/library` |
| `dist/` | 页面（`index.html`、`app.js`、自带图片风格 `photo.js`、截图标注 `shot.js`）、Markdown 渲染 `md.js`、排版引擎 `wx-layouts.js` |
| `data/style-library/` | 11 套风格的 Prompt 与样图（作者照片目录 `_owner/` 不入库） |
| `skills/` | Codex Skill：写作、配图与同步、封面 |
| `scripts/` | 同步脚本、人像参考导出 |

文章、图片、`workspace.json`、作者照片、备份、`成品/` 和 `.env` 都是个人数据，已在 `.gitignore` 中排除。

## 许可证 / 版权

© 2026 史鸿洁。本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans)（知识共享 署名-非商业性使用 4.0 国际）许可：

- 可以使用、复制、修改和再分发；
- 必须署名原作者 **史鸿洁** 并注明出处（附上本项目链接和许可证链接，说明是否做过修改）；
- 不得用于商业用途。

风格样图带有“© 史鸿洁”水印，转载样图时请保留。完整条款见 [LICENSE](LICENSE)。
