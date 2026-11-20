# CV Roast TR 🔥

> **Privacy First (KVKK-Aligned):** Uploaded PDFs and pasted resumes are processed strictly in memory—never written to disk, never stored in a database, and never logged. Before any text is sent to an LLM, Turkish PII (emails, phone numbers, TC ID numbers, IBANs, profile URLs, and street addresses) is automatically masked.

**CV Roast TR** is an open-source web application that reviews Turkish resumes through the eyes of a candid, witty hiring manager. Unlike generic ATS checkers that flatter candidates, it calls out Turkey-specific resume habits (passport photos, marital status, military service, "MS Office skills", empty clichés) and pairs every critique with a concrete fix and a before/after rewrite.

## Highlights

- **Next.js (App Router) + TypeScript (strict) + Tailwind CSS + Zod**
- **Modular Markdown Prompts (`prompts/`):** Separate files for base rules, 3 tones (`gentle`, `honest`, `brutal`), and 6 sectors (`general`, `software`, `marketing`, `finance`, `engineering`, `design`).
- **Provider-Agnostic LLM Layer (`src/lib/llm/`):** Supports Google Gemini (default), OpenAI, and Anthropic, plus **Bring Your Own Key (BYOK)** scoped strictly to a single request.
- **Hallucination Guard:** Every quote returned by the LLM is verified against the resume text using Turkish-aware normalized matching; unverified critiques are filtered out automatically.
- **Prompt Injection Defense:** Resume and job description blocks are strictly delimited and sanitized.
- **Shareable PNG Roast Card:** Generated client-side on `<canvas>` with only the score, tone, and an anonymized witty one-liner—no names, contact info, or resume quotes.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY (or OPENAI_API_KEY / ANTHROPIC_API_KEY) to .env.local
npm run dev
```

For full Turkish documentation, see [README.md](README.md). For architecture details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
