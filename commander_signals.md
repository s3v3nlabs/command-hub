# FIELD COMMAND ROUTER — CMDHUB–04

## ⚠️ OVERRIDES
Field-level command codes accepted by the router.

### 🧠 COMMAND REFERENCE

| Code           | Action                          | Priority | Response                    |
|----------------|---------------------------------|----------|----------------------------|
| SYS/PING       | Return heartbeat                | Low      | PONG                       |
| SYS/STATUS     | System status report            | Medium   | Detailed status JSON       |
| SYS/REBOOT     | Re-init logic loop              | High     | Confirmation on completion |
| SYS/HELP       | List available commands         | Low      | Command reference          |
| GL/SYNC        | Push to ghostlight_bridge.ts    | High     | Sync status                |
| GL/STATUS      | GhostLight connection status    | Medium   | Connection details         |
| GL/DISCONNECT  | Disconnect from GhostLight      | High     | Confirmation               |
| DRIFT/SCAN     | Check for AI logic drift        | Medium   | Drift report               |
| DRIFT/CORRECT  | Force drift correction          | Critical | Correction report          |
| RECON/PULSE    | Run recon scanners              | Medium   | Scan results               |
| RECON/TARGETS  | List available recon targets    | Low      | Target list                |
| AUTH/ELEVATE   | Request elevated permissions    | High     | Auth result                |
| AUTH/STATUS    | Check current auth level        | Low      | Auth level details         |

## 🧠 Signal Pattern Notes
All codes follow the pattern: `[MODULE]/[ACTION]`

- **MODULE**: System component or domain
- **ACTION**: Specific operation to perform

Use `thread_router.ts` to resolve routing and execute commands.

## 🔄 Response Format
Standard response format:

\`\`\`json
{
  "status": "success|error|pending",
  "message": "Human-readable message",
  "data": {}, // Optional data payload
  "timestamp": 1620000000000
}
\`\`\`

## 🛡️ Security Considerations
- Commands with HIGH or CRITICAL priority require authorization
- All command executions are logged for audit
- Failed authorization attempts trigger security alerts
- Rate limiting applies to prevent command flooding

## 🔗 Integration
This command structure integrates with:
- `thread_router.ts` for routing
- `agent_logic_loop.ts` for execution
- `ghostlight_bridge.ts` for external communication
