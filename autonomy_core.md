# CMDHUB–04 // AUTONOMY LAYER CORE

## 🧠 Overview
This module governs the full lifecycle of autonomous agent logic:
- Local-only execution path
- LLM-harness abstraction
- Thread-based logic routing
- Self-healing agent feedback

## 🔧 Structure
- `agent_logic_loop.ts` – core decision & drift correction loop
- `thread_router.ts` – routes commands between ops modules
- `llm_harness_config.md` – model config, prompt pathways, activation modes
- `commander_signals.md` – field instructions, overrides, signal schema

## 🔄 Flow
1. User or system emits signal
2. `thread_router` dispatches to agent logic
3. `agent_logic_loop` runs drift/ping/self-heal
4. Responses logged in diagnostics + optionally sync'd to Ghostlight

## 🔗 Integration Points
- Connects with SelfHealingAgentCore for proposal processing
- Interfaces with Vault for persistent storage
- Leverages Replay for simulation and validation
- Communicates with GhostLight through bridge

## 🛡️ Security Considerations
- All commands are validated through AutonomyGovernor
- Sensitive operations require multi-model consensus
- Offline mode available for air-gapped environments
- All actions are logged and can be replayed for audit
