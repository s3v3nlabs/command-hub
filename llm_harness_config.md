# LLM HARNESS CONFIG – OFFLINE MODE

## 🧠 Purpose
Configure fallback pathways for executing LLM prompts **without external API calls** (no OpenAI/Anthropic/etc).

## 🛠 Parameters
- `model_route`: Local, Shared, GhostNode
- `prompt_type`: Raw, Template, Instructional
- `execution_mode`: Isolated, Reflective, Relay

## 🧪 Sample Configuration
\`\`\`json
{
  "model_route": "Local",
  "prompt_type": "Instructional",
  "execution_mode": "Isolated",
  "temperature": 0.7,
  "max_tokens": 1024,
  "fallback_strategy": "Cached",
  "timeout_ms": 5000
}
\`\`\`

## 🔄 Execution Modes
- **Isolated**: Run without context from previous executions
- **Reflective**: Include self-analysis in the prompt
- **Relay**: Chain multiple models together for consensus

## 🔗 Integration
Used in `agent_logic_loop.ts` to determine LLM call strategy.

## 🛡️ Security Notes
- Local execution never sends data outside the system
- Cached responses available for common queries
- Sensitive information is redacted before processing
