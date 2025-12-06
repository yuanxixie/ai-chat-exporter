# AI Chat Exporter

A minimal web tool to export your AI chat history from Claude and ChatGPT by date.

## Features

- **Multi-platform support**: Claude and ChatGPT
- **Flexible date selection**: Single day, date range, or export all
- **Content filtering**: Export both sides, user only, or AI only
- **Multiple formats**: Markdown (.md) or Plain Text (.txt)
- **Calendar view**: Visual calendar showing days with conversations
- **Privacy-first**: Runs entirely in your browser, no data uploaded

## How to Use

### Step 1: Export your data

**Claude:**
1. Go to claude.ai → Settings → Export Data
2. Wait for email, download ZIP
3. Extract and find `conversations.json`

**ChatGPT:**
1. Go to chat.openai.com → Settings → Data controls → Export data
2. Wait for email, download ZIP
3. Extract and find `conversations.json`

### Step 2: Use the tool

1. Open `index.html` in your browser (or visit the [live demo](https://yuanxixie.github.io/ai-chat-exporter/))
2. Select platform (Claude or ChatGPT)
3. Upload your `conversations.json` file
4. Choose date(s) from the calendar
5. Select what to export (both, user only, or AI only)
6. Choose format (Markdown or Plain Text)
7. Click Export

## Output Format

Exported files are named: `{platform}-{date}-{content}.{ext}`

Example: `claude-2025-12-06-user-only.md`
```markdown
# 2025-12-06

## Conversation Title

Content here...

---

## Another Conversation

More content...
```

## Tech Stack

- Pure HTML, CSS, JavaScript
- No dependencies
- No build step
- Runs offline

## Privacy

This tool runs 100% in your browser. Your conversation data never leaves your computer.

## License

MIT
