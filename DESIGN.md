# DESIGN.md - 字体展馆设计系统规范

## Visual World & Metaphor
- **Design Philosophy**: 活字标本陈列馆与现代独立字体工作室的结合体。
- **Lighting Atmosphere**:
  - `Dark (暗房深曜石)`: Background `#0c0d10`, Surface `#14161b`, Border `#222630`, Text `#f1f3f7`, Muted `#8b93a3`, Accent `#d97706` (琥珀印金)
  - `Light (纸本象牙白)`: Background `#f8f7f4`, Surface `#ffffff`, Border `#e5e2db`, Text `#18191c`, Muted `#686d76`, Accent `#b45309` (朱砂暖褐)

## Typography System
- **Display & Identity**: `"Noto Serif SC"`, `"Songti SC"`, `"Source Han Serif"`, `Baskerville`, `Georgia`, serif
- **Interface & UI**: `system-ui`, `-apple-system`, `"PingFang SC"`, `"Microsoft YaHei"`, `"Noto Sans SC"`, sans-serif
- **Data & Measurement**: `"SF Mono"`, `"JetBrains Mono"`, `"Fira Code"`, monospace

## Spacing & Density
- Base grid: 4px / 8px / 16px / 24px / 32px / 48px
- Card radius: 6px (克制微圆角，保留纸张与切印边锋感)
- Contrast guarantee: 所有正文与文本对比度严控在 ≥ 4.5:1

## Anti-Pattern Blacklist (Strictly Enforced)
- NO gradient text
- NO generic kickers / eyebrows above headings
- NO same-size generic cards with icon + title + description
- NO 0-blur block drop-shadows
- NO emoji icons (only authored consistent 1.5px SVG vectors)
