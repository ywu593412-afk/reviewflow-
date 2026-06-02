# difflens-ai

A code review framework driven by LangGraph and Gemini, with a deterministic validation layer that prevents invalid line references from reaching your reports.

Unlike conventional LLM-based review workflows, **difflens-ai** enforces a strict structural verification layer. The core engine parses diff hunks to construct an **immutable coordinate reference map**. Every LLM-generated comment is then cross-validated against this map — any comment anchored to a non-existent or unmodified line is discarded before the report is rendered.

## 📦 Installation & Quick Start

```bash
# 1. Install the CLI tool globally
npm install -g difflens-ai

# 2. Configure your Gemini API Key
export GEMINI_API_KEY="your_gemini_api_key_here"

# 3. Navigate to your project and execute the review pipeline
cd your-git-repository
difflens-ai
