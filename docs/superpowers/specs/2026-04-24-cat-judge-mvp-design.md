# 猫咪法官 MVP 设计文档

## Context

情侣之间发生矛盾后，往往缺乏一个中立的第三方来客观分析问题。猫咪法官是一个 Web 应用，扮演正经法庭风格的"猫咪法官"角色，让双方通过提交微信聊天记录等证据，进行 AI 驱动的情感分析和公正"判决"，帮助情侣理性看待矛盾。

## 产品定义

- **形态**：Web 应用（React SPA + Python FastAPI）
- **核心模式**：双方对质 — 原告创建案件，被告通过链接加入
- **输入方式**：微信导出文件、聊天截图（OCR）、手动输入文本
- **人格**：正经法庭风，使用虚构但逻辑自洽的"感情法条"
- **AI**：多模型支持（Claude / OpenAI / 国产模型），统一 Provider 接口
- **范围**：MVP — 核心流程走通，不涉及用户系统、付费、历史记录持久化

## 用户流程

1. **原告**访问首页，点击"提起诉讼"
2. 填写昵称，上传证据（聊天记录/截图/文本控诉）
3. 系统生成案件链接
4. **原告**将链接发送给**被告**
5. **被告**打开链接，填写昵称，提交己方证据
6. 双方就位后，进入庭审直播室
7. AI 法官开始多阶段审判，流式输出分析过程
8. 审判结束，生成正式判决书
9. 双方查看判决书，含事实认定、法条引用、判决结果

## 系统架构

```
React SPA (Vite + TypeScript + TailwindCSS)
    │
    ├── 首页 — 品牌展示 + 创建/加入案件
    ├── 证据提交页 — 上传组件 + 状态同步
    ├── 庭审直播室 — WebSocket 实时 + 流式渲染
    └── 判决书页 — 正式文书展示
    │
    │ HTTP REST + WebSocket
    │
Python FastAPI 后端
    │
    ├── 案件管理 — 创建/加入/状态机
    ├── 证据解析 — 文本解析 + OCR + 文件处理
    ├── WebSocket 房间 — 双方实时同步
    ├── AI 引擎 — 多阶段 Prompt + 多模型 Provider
    └── SQLite — 案件/证据存储（MVP）
```

## 数据模型

### Case（案件）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 案件唯一标识 |
| status | Enum | `waiting_plaintiff` → `waiting_defendant` → `both_ready` → `in_session` → `verdict` |
| plaintiff_name | str | 原告昵称 |
| defendant_name | str | 被告昵称 |
| plaintiff_token | UUID | 原告访问令牌 |
| defendant_token | UUID | 被告访问令牌 |
| created_at | datetime | 创建时间 |
| verdict | JSON | 判决书内容 |

### Evidence（证据）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 证据唯一标识 |
| case_id | UUID | 所属案件 |
| role | Enum | `plaintiff` / `defendant` |
| type | Enum | `wechat_export` / `screenshot` / `text` |
| content | Text | 解析后的文本内容 |
| raw_file_path | str | 原始文件路径（如有） |
| created_at | datetime | 提交时间 |

## AI 引擎设计

### 多模型 Provider 接口

```python
class AIProvider(ABC):
    @abstractmethod
    async def stream_analysis(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        """流式输出分析结果"""
        ...

class ClaudeProvider(AIProvider): ...
class OpenAIProvider(AIProvider): ...
class QwenProvider(AIProvider): ...  # 通义千问
```

### 多阶段审判流水线

| 阶段 | Prompt 目标 | 输出 |
|------|-------------|------|
| 1. 证据解析 | 分别解读双方证据，提取关键事实 | 事实摘要 |
| 2. 事实认定 | 综合双方证据，认定客观事实 | 事实清单 |
| 3. 法条适用 | 匹配感情法条，分析责任 | 法条引用 + 责任分析 |
| 4. 宣判 | 生成正式判决书 | 完整判决书 |

每个阶段独立 prompt，流式输出通过 WebSocket 推送到前端。

### System Prompt 核心

- 角色：猫咪法庭审判长，严肃但带有猫咪元素
- 原则：不偏袒任何一方，基于证据客观分析
- 感情法条库：预定义的虚构法条（冷暴力推定、双向沟通义务、纪念日关怀义务等）
- 输出格式：严格遵循判决书模板

## API 设计

### REST
- `POST /api/cases` — 创建案件（返回案件链接 + 原告令牌）
- `POST /api/cases/{id}/join` — 被告加入（返回被告令牌）
- `POST /api/cases/{id}/evidence` — 提交证据
- `GET /api/cases/{id}/verdict` — 获取判决书

### WebSocket
- `WS /ws/cases/{id}?token={token}` — 庭审实时连接
  - 服务端推送：`stage_change`、`analysis_chunk`、`verdict_complete`
  - 客户端发送：`heartbeat`、`ready`

## 前端组件

| 组件 | 职责 |
|------|------|
| `HomePage` | 品牌展示 + 创建/加入案件入口 |
| `EvidenceUpload` | 文件上传 + 截图上传 + 文本输入 + OCR 预览 |
| `WaitingRoom` | 等待对方就位，实时状态同步 |
| `Courtroom` | 庭审直播 — 证据面板 + 法官输出 + 进度条 |
| `VerdictPage` | 判决书展示（正式文书风格） |
| `EvidencePanel` | 证据列表卡片 |
| `JudgeMessage` | 法官消息气泡（流式打字效果） |

## 技术选型

| 层 | 技术 | 理由 |
|----|------|------|
| 前端框架 | React 18 + TypeScript | 用户选择 |
| 前端构建 | Vite | 快速开发体验 |
| CSS | TailwindCSS | 快速实现法庭风格 UI |
| 后端框架 | FastAPI | 异步 + WebSocket 原生支持 |
| 数据库 | SQLite (MVP) | 零配置，后续可迁移 PostgreSQL |
| OCR | PaddleOCR 或云端 OCR API | 截图文字识别 |
| AI 模型 | Claude (默认) + OpenAI + 通义千问 | 长文本分析强，多模型可切换 |
| WebSocket | FastAPI WebSocket | 原生支持，无需额外库 |

## 项目结构

```
CatJudge/
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   ├── pages/           # 页面
│   │   ├── hooks/           # 自定义 hooks (useWebSocket 等)
│   │   ├── api/             # API 调用封装
│   │   ├── types/           # TypeScript 类型定义
│   │   └── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── backend/                 # Python FastAPI
│   ├── app/
│   │   ├── main.py          # FastAPI 入口
│   │   ├── models/          # SQLAlchemy 模型
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API 路由
│   │   ├── services/        # 业务逻辑
│   │   │   ├── case_service.py
│   │   │   ├── evidence_service.py
│   │   │   └── ai_engine.py
│   │   ├── ai/              # AI Provider 层
│   │   │   ├── base.py      # AIProvider 抽象类
│   │   │   ├── claude_provider.py
│   │   │   ├── openai_provider.py
│   │   │   └── prompts/     # Prompt 模板
│   │   └── ws/              # WebSocket 管理
│   │       └── room_manager.py
│   ├── requirements.txt
│   └── .env.example
├── docs/
└── README.md
```

## MVP 不做的事

- 用户注册/登录（通过案件 token 临时访问）
- 案件历史列表（刷新即丢失，除非收藏了链接）
- 付费/订阅
- 分享到社交媒体
- 多语言
- 移动端原生适配（响应式 Web 即可）

## 验证方式

1. 启动后端 `uvicorn app.main:app --reload`
2. 启动前端 `npm run dev`
3. 打开两个浏览器窗口，模拟原告和被告
4. 原告创建案件，提交微信聊天记录
5. 复制案件链接在第二个窗口打开，被告提交控诉文本
6. 双方进入庭审，观察 AI 流式输出审判过程
7. 审判结束，验证判决书格式和内容质量
