# DESIGN.md - 字體展館設計系統規範

## Visual World & Metaphor
- **Design Philosophy**: 活字標本陳列館與現代獨立字體工作室的結合體。
- **Lighting Atmosphere**:
  - `Dark (暗房深曜石)`: Background `#0c0d10`, Surface `#14161b`, Border `#222630`, Text `#f1f3f7`, Muted `#8b93a3`, Accent `#d97706` (琥珀印金)
  - `Light (紙本象牙白)`: Background `#f8f7f4`, Surface `#ffffff`, Border `#e5e2db`, Text `#18191c`, Muted `#686d76`, Accent `#b45309` (朱砂暖褐)

## Typography System
- **Display & Identity**: `"Noto Serif TC"`, `"Songti TC"`, `"Source Han Serif TC"`, `"Source Han Serif TW"`, `Baskerville`, `Georgia`, serif
- **Interface & UI**: `system-ui`, `-apple-system`, `"PingFang TC"`, `"Hiragino Sans TC"`, `"Microsoft JhengHei"`, `"Noto Sans TC"`, sans-serif
- **Data & Measurement**: `"SF Mono"`, `"JetBrains Mono"`, `"Fira Code"`, monospace

## Spacing & Density
- Base grid: 4px / 8px / 16px / 24px / 32px / 48px
- Card radius: 6px (克制微圓角，保留紙張與切印邊鋒感)
- Contrast guarantee: 所有正文與文字對比度嚴控在 ≥ 4.5:1

## Anti-Pattern Blacklist (Strictly Enforced)
- NO gradient text
- NO generic kickers / eyebrows above headings
- NO same-size generic cards with icon + title + description
- NO 0-blur block drop-shadows
- NO emoji icons (only authored consistent 1.5px SVG vectors)
