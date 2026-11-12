# Ghostlight Vault

Shareable local search over a ChatGPT data export. Speaks **MCP** (streamable HTTP + stdio) and a small **REST API**, with real bearer-token auth on HTTP, localhost-only by default, and ingest off until you opt in.

Full setup, tunnel, and per-client connect guide: **[docs/GHOSTLIGHT_VAULT.md](../../docs/GHOSTLIGHT_VAULT.md)**.

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
./run.sh                          # creates .bearer_token, listens on 127.0.0.1:8765
# in another shell:
export GHOSTLIGHT_VAULT=./data/vault
PYTHONPATH=src .venv/bin/python -m ghostlight_vault import /path/to/conversations.json
PYTHONPATH=src .venv/bin/python -m ghostlight_vault smoke
```

In the Command Hub, set `GHOSTLIGHT_VAULT_URL` and `GHOSTLIGHT_VAULT_TOKEN` and open **`/vault`**.

**Credit:** Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC. Apache-2.0.
