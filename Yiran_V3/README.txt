怡然 · 五墨雅集 V5.3 — 清晰宋韵版

在 V5.2 点击弹窗版上调整：
- 中文界面统一使用清晰易读的宋体/明体字形，不再加载行草花体。
- 延用「焦、浓、重、淡、清」真实画布笔痕示意，及原有五色、笔锋功能。
- 所有工具选择面板默认关闭，点击工具打开一个，其余自动关闭。
- 心情札记只会由用户主动点击打开，不再自动弹窗。

使用：解压后双击 index.html；如需继续编辑，请将整个文件夹导入 VS Code。
字体：优先电脑中的 Noto Serif CJK SC / 思源宋体，若未安装会回退为系统宋体（如 Windows SimSun、macOS Songti SC）。
如希望不同设备像素级统一，未来可自行在项目中配置经授权的 Web Font（本压缩包不包含字体文件）。

项目源代码包含此前 V5 使用的 MIT License 第三方 WebGL 代码。


V5.4 流墨/泼墨改进：
- 沿用用户上传的 WebGL Fluid Simulation (Pavel Dobryakov, MIT) 的流体原理和当前 V5 WebGL 实现。
- 大幅增加墨水速度和涡旋流动，并使墨团边缘出现不规则起伏。
- 轻点画布形成墨团、逐渐落下的飞沫；拖动鼠标时按方向甩出墨滴。
- 焦、浓、重、淡、清分别拥有不同墨量、水润度与飞溅数量。
- 在「笔锋」菜单可调整泼墨力度，五色、撤回、清空、保存与手动情绪卡片保留。
- 点击菜单才会展开；菜单彼此互斥。
- 请用支持 WebGL 的 Chrome 或 Edge 运行，建议启用硬件加速。

Third-party reference: WebGL Fluid Simulation by Pavel Dobryakov, MIT License.
The existing app.js embeds its MIT permission header. A copy of LICENSE is included.

若设备未启用 WebGL，ink-fallback.js 提供 Canvas 2D 兼容泼墨模式（非完整流体物理计算）。
