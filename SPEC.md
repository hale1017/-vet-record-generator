# 病歷自動生成器（Vet Record Generator）— 專案規格

> 目標：把 case 資訊 → 自動生成「醫院格式」病歷（Word `.docx`），取代手寫。
> 現況痛點：手寫一份病歷約 20 分鐘、每天約 5 份 → 大幅提效。
> 使用者：先給 20–40 位同學用，日後想長成醫院級系統。
>
> **臨床格式的權威來源在 VetVault**（跨 vault 不能用 `[[連結]]`，以路徑文字記錄）：
> `D:\obsidian\VetVault\20_VetSchool\clinical\workflows\WF-0002_medical-record-generator.md`
> —— 含 Profile A/B 醫院病歷格式、縮寫詞彙表、去識別化清單。本 repo 的欄位/區段設定以該檔為準。

---

## 使用者需求（2026-07-03 訪談確認）
1. 可讓身邊的人下載/連上使用，不限自己筆電；**盡量免費**、**跨作業系統**。
2. 先選病例格式（不同科別/老師各有特殊需求）→ 上傳手寫病歷照片 → 自動把可取得資訊填入設計好的欄位。
3. 不清楚或想補充 → **錄音 → 語音轉錄**填入。
4. 作者逐欄親自確認無誤再存最終檔；**大部分內容轉英文**，醫院名/寵物名可保留中文；有問題自行手動改。

---

## 架構決定（已鎖定 2026-07-03）
| 項目 | 決定 | 理由 |
|---|---|---|
| **形式** | **純前端瀏覽器網頁 App**（無後端伺服器） | 天生跨平台（不用分 Mac/Win 打包）；靜態託管可免費 |
| **託管** | 免費靜態託管（Cloudflare Pages / GitHub Pages 免費額度） | host 端零月租 |
| **AI 費用** | **BYO API key**，兩家可選：**OpenAI**（付費、不拿資料訓練）或 **Google Gemini**（有免費額度）。使用者在設定裡自選，呼叫從自己瀏覽器發出 | 讓 host「盡量免費」；OpenAI API 無免費方案，想全免費用 Gemini（代價：免費版資料可能被 Google 使用、有每日上限） |
| **成本量級（供參）** | 雲端 vision+STT+翻譯每份約 $0.02–0.10；20–40 人×5 份/日 ≈ $100–300/月 | 這筆錢必須有人付 → 用 BYO key 分攤到各使用者 |
| **隱私（VetVault Rule 4）** | **去識別化在使用者電腦端做完再送雲端**：上傳後先在螢幕框掉/塗掉飼主姓名、電話、病歷號、晶片號，redacted 影像才送 AI | 真實病歷屬敏感資料，不得整張原圖上雲 |
| **OCR 輸入** | 手寫**中英夾雜＋專有縮寫** → vision AI 辨識，餵縮寫詞彙表輔助 | 已知手寫特性 |
| **翻譯** | 內容轉英文；**醫院名/寵物名保留中文** | 使用者指定 |
| **產出** | 瀏覽器端 `docx.js`（JS 版）產 `.docx` | 純前端不能跑 Python |

---

## MVP 使用流程
```
1. 選格式（Profile A 預設外科 / B 特殊老師 / 未來 C 內科）
2. 上傳手寫病歷照片 → 螢幕上框掉/塗掉敏感欄位（client-side 去識別化）
3. redacted 影像送 vision AI → 依 profile 對應欄位 + 中英翻譯（醫院名/寵物名留中文）
4. 缺漏/想補充 → 錄音 → 語音轉錄填入
5. 逐欄確認 / 手動修改
6. 一鍵匯出 .docx（沿用 Profile A/B 已逆向格式）
```
- 缺漏欄位 → App **主動列出「還缺什麼」**讓使用者補，不自行編造臨床數據（VetVault Rule 9）。

---

## 技術棧
- **前端**：靜態 HTML/JS（可選輕框架，避免重工具鏈以利免費靜態託管）。
- **產檔**：瀏覽器端 `docx.js`（`docx` npm 套件的瀏覽器 build）產 `.docx`。
- **AI**：BYO key，瀏覽器直接呼叫雲端 API。
  - Vision OCR＋欄位對應＋翻譯：Claude / GPT vision。
  - 語音轉錄：Whisper 類 API。
- **去識別化**：canvas 前端塗黑/裁切，redacted 後才送 AI。
- **無後端**：MVP 不存任何伺服器端資料；使用者 key 只留在瀏覽器（localStorage / session）。

---

## 階段路線
- **Phase 1（MVP，現在）**：純前端 App、BYO key、靜態託管；先給 20–40 位同學用。
  - MVP 第一版：選格式 → 上傳照片 → client-side 去識別化 → `docx.js` 產 .docx 骨架（**先不接 AI，把流程跑通**）。
  - 之後接 vision AI（OCR＋欄位對應＋翻譯）＋語音轉錄。
- **Phase 2**：加後端（登入、共用計費、病歷暫存/管理、詞彙表雲端共編）。
- **Phase 3**：醫院級（權限分級、正式去識別化流程、稽核、對接醫院 NAS/HIS）。
- 原則：Phase 1 就把「資料流」與「profile 可擴充」設計乾淨，日後升級不打掉重練。

---

## 目前狀態
- ✅ 方向定案（2026-07-03）。
- ✅ 臨床格式已逆向（Profile A/B），權威來源在 VetVault WF-0002。
- ✅ **MVP 第一版完成（2026-07-03，先不接 AI）**：4 步精靈（選格式 → 上傳照片+client 端去識別化 → 填欄位 → 確認匯出）；Profile A/B 皆可產出 `.docx`（瀏覽器測試通過，兩範本各約 8KB）。
- ✅ **AI 功能完成（2026-07-03）**：
  - **BYO key 設定介面**（⚙ 設定 modal）：OpenAI key + 模型（gpt-4o / gpt-4o-mini），存 localStorage，只在使用者本機。
  - **照片 AI 辨識預填**：步驟 2「用 AI 辨識照片並填入欄位」→ GPT-4o vision 讀 redacted 影像 → 依 profile 欄位輸出 JSON（中英翻譯、name/醫院名留中文、不虛構）→ 預填步驟 3。
  - **語音轉錄**：步驟 3 每個自由欄位旁 🎤 → MediaRecorder 錄音 → Whisper 轉文字 → 附加進該欄位。
  - 檔案：`js/ai.js`（**雙供應商** OpenAI / Gemini，可在設定切換；兩家 key 分開存 localStorage）。
  - **已驗證**：模組載入、供應商切換與分開存 key、設定 modal 動態切換、mic 綁定（A 9 顆 / B 25 顆）、docx 產出；且 **`api.openai.com` 與 `generativelanguage.googleapis.com` 皆支援瀏覽器直呼（CORS 通過）** → 純前端 BYO key 架構對兩家都成立。
  - ⚠️ 未驗證（需真實 key + 真實手寫病歷）：OCR/轉錄的實際品質；Gemini 音訊對 webm 格式的接受度（Chrome MediaRecorder 產 webm/opus，若 Gemini 拒收再調錄音格式或該情境改用 OpenAI）。
  - 技術備忘：docx CDN **必須 `build/index.umd.js`**（`index.js` 不掛全域 `docx`）。本機預覽 `python -m http.server 8000`。
- ⏳ **下一步**：④ 推 GitHub + 免費靜態託管上線（Cloudflare/GitHub Pages）給同學用；用真實去識別化病歷實測 OCR/轉錄品質並微調 prompt；視情況加 Claude vision 選項。
