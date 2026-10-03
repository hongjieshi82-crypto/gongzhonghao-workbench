# 公众号工作台

作者：史鸿洁

在本机运行的微信公众号排版工作台。三步出稿：**文章 → 选一套风格 → 手机预览并复制到公众号**。

- 8 套风格，每套把正文配图画风、900×383 横幅封面、公众号排版主题和配色绑在一起（配置在 `data/style-library/<风格>/style-config.json`）。
- 排版引擎（`dist/wx-layouts.js`）会把文章渲染成带内联样式的 HTML。“复制到公众号”把它作为富文本放进剪贴板，可以直接粘贴到公众号后台。
- 写作与生图不在网页里调用任何付费 API。网页按钮只复制指令，交给本机 Codex 对话（`skills/` 下的三个 Skill）完成，再由 `scripts/sync-workbench.py` 同步回工作台。

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
| `dist/` | 页面（`index.html`、`app.js`）、Markdown 渲染 `md.js`、排版引擎 `wx-layouts.js` |
| `data/style-library/` | 8 套风格的 Prompt 与样图（作者照片目录 `_owner/` 不入库） |
| `skills/` | Codex Skill：写作、配图与同步、封面 |
| `scripts/` | 同步脚本、人像参考导出 |

文章、图片、`workspace.json`、作者照片、备份、`成品/` 和 `.env` 都是个人数据，已在 `.gitignore` 中排除。

## 许可证 / 版权

© 2026 史鸿洁。本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans)（知识共享 署名-非商业性使用 4.0 国际）许可：

- 可以使用、复制、修改和再分发；
- 必须署名原作者 **史鸿洁** 并注明出处（附上本项目链接和许可证链接，说明是否做过修改）；
- 不得用于商业用途。

风格样图带有“© 史鸿洁”水印，转载样图时请保留。完整条款见 [LICENSE](LICENSE)。
