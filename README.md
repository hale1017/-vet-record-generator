# vet-record-generator

把 case 資訊 → 自動生成「醫院格式」病歷（Word `.docx`），取代手寫。給獸醫輪診同學用的**純前端網頁工具**。

- **形式**：純前端瀏覽器 App（跨平台、免費靜態託管）。
- **AI**：BYO API key（每位使用者自帶 key，費用各自付）。
- **隱私**：去識別化在使用者電腦端做完再送雲端（真實病歷屬敏感資料）。
- **產出**：瀏覽器端 `docx.js` 產 `.docx`。

完整規格見 [SPEC.md](SPEC.md)。

> 臨床格式（Profile A/B、縮寫表、去識別化清單）的權威來源在 VetVault：
> `D:\obsidian\VetVault\20_VetSchool\clinical\workflows\WF-0002_medical-record-generator.md`

## 狀態
方向定案（2026-07-03）。下一步：搭 MVP 第一版（選格式 → 上傳 → 去識別化 → 產 .docx 骨架，先不接 AI 跑通流程）。
