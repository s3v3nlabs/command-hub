"""Singular/ty Command Hub — Termux phone companion.

A light operator *client* that talks to a remote Command Hub (laptop, VPS,
or Tailscale). This does not run the full Next.js suite, Ghidra, the Android
Lab, or Docker on the phone.

Copyright 2026 Christian Wilford (s3v3n), AI Architect, Offensive Security
Enthusiast, Founder of Singular/ty Defense Solutions, LLC.

Licensed under the Apache License, Version 2.0.
"""

from __future__ import annotations

import json
import os
import ssl
import uuid
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request as UrlRequest, urlopen

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

APP_DIR = Path(__file__).resolve().parent
ROOT = APP_DIR.parent
CONFIG_PATH = ROOT / "config.local.json"
ENV_PATH = ROOT / ".env"

MAX_BODY = 2 * 1024 * 1024
HTTP_TIMEOUT = 8

# Local filters only — mirrors lib/workspaces/presets.ts featured routes.
WORKSPACE_PRESETS = [
    {
        "id": "red",
        "label": "Red Team",
        "tagline": "Offense — recon → kill-chain → engagement reporting.",
        "accent": "#ef4444",
        "featured": [
            "/offsec",
            "/offsec/osint",
            "/offsec/hardware",
            "/offsec/c2",
            "/offsec/threat-field",
            "/offsec/engagements",
            "/reports",
        ],
    },
    {
        "id": "blue",
        "label": "Blue Team",
        "tagline": "Defense — Heimdall, ATT&CK heatmap, deception, audit.",
        "accent": "#3b82f6",
        "featured": [
            "/command-hub",
            "/offsec/attack-navigator",
            "/offsec/deception",
            "/offsec/replay",
            "/audit",
            "/privacy",
        ],
    },
    {
        "id": "tiger",
        "label": "Tiger Team",
        "tagline": "Full-spectrum purple — attack, detect, replay, report.",
        "accent": "#a855f7",
        "featured": [
            "/offsec",
            "/offsec/c2",
            "/offsec/attack-navigator",
            "/offsec/replay",
            "/offsec/threat-field",
            "/offsec/deception",
            "/reports",
        ],
    },
    {
        "id": "investigator",
        "label": "Investigator",
        "tagline": "OSINT, entity graph, evidence, intelligence.",
        "accent": "#f59e0b",
        "featured": [
            "/offsec/osint",
            "/offsec/graph",
            "/intelligence/cctv",
            "/offsec/toolkit",
            "/evidence-explorer",
            "/reports",
        ],
    },
    {
        "id": "all",
        "label": "All Modules",
        "tagline": "No preset — show everything.",
        "accent": "#67e8f9",
        "featured": [],
    },
]

QUICK_LINKS = [
    ("/operator", "Operator"),
    ("/marketplace", "Marketplace"),
    ("/audit", "Audit"),
    ("/black-aurora", "Black Aurora"),
    ("/offsec", "OffSec"),
    ("/compute", "Compute"),
    ("/signalframe/presence", "Presence"),
]

CREDIT = (
    "Christian Wilford (s3v3n), AI Architect, Offensive Security Enthusiast, "
    "Founder of Singular/ty Defense Solutions, LLC."
)

app = FastAPI(
    title="Singular/ty Command Hub — Termux Companion",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(APP_DIR / "templates"))
templates.env.globals["credit"] = CREDIT
templates.env.globals["version"] = "1.0.0"
templates.env.globals["quick_links"] = QUICK_LINKS
templates.env.globals["workspaces"] = WORKSPACE_PRESETS


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

def _load_dotenv(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip("'").strip('"')
        if key:
            out[key] = val
    return out


def default_config() -> dict[str, Any]:
    env = {**_load_dotenv(ENV_PATH), **os.environ}
    return {
        "hub_base_url": (env.get("HUB_BASE_URL") or "").strip().rstrip("/"),
        "hub_api_token": (env.get("HUB_API_TOKEN") or "").strip(),
        "operator_name": (env.get("OPERATOR_NAME") or "").strip() or "termux-op",
        "operator_id": "",
        "tls_insecure": (env.get("COMPANION_INSECURE_TLS") or "").strip() in {"1", "true", "yes"},
    }


def load_config() -> dict[str, Any]:
    cfg = default_config()
    if CONFIG_PATH.is_file():
        try:
            raw = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
            if isinstance(raw, dict):
                for key in ("hub_base_url", "hub_api_token", "operator_name", "operator_id"):
                    if raw.get(key) is not None:
                        cfg[key] = str(raw.get(key) or "").strip()
                if "tls_insecure" in raw:
                    cfg["tls_insecure"] = bool(raw["tls_insecure"])
        except (OSError, json.JSONDecodeError):
            pass
    if cfg["hub_base_url"]:
        cfg["hub_base_url"] = cfg["hub_base_url"].rstrip("/")
    return cfg


def save_config(cfg: dict[str, Any]) -> None:
    payload = {
        "hub_base_url": str(cfg.get("hub_base_url") or "").strip().rstrip("/"),
        "hub_api_token": str(cfg.get("hub_api_token") or "").strip(),
        "operator_name": str(cfg.get("operator_name") or "").strip() or "termux-op",
        "operator_id": str(cfg.get("operator_id") or "").strip(),
        "tls_insecure": bool(cfg.get("tls_insecure")),
    }
    CONFIG_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    try:
        os.chmod(CONFIG_PATH, 0o600)
    except OSError:
        pass


def normalize_base(url: str) -> str:
    u = (url or "").strip().rstrip("/")
    parsed = urlparse(u)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("HUB_BASE_URL must start with http:// or https://")
    if not parsed.netloc or parsed.username or parsed.password:
        raise ValueError("HUB_BASE_URL has an invalid host")
    if parsed.netloc.lower() in {"localhost", "127.0.0.1", "[::1]"} or parsed.netloc.startswith(
        "127."
    ):
        # Allowed (same-device or adb reverse), just accepted.
        pass
    return u


def public_config(cfg: dict[str, Any]) -> dict[str, Any]:
    """Safe-to-render view of config — never includes the raw token."""
    return {
        "hub_base_url": cfg.get("hub_base_url") or "",
        "has_token": bool(cfg.get("hub_api_token")),
        "operator_name": cfg.get("operator_name") or "termux-op",
        "tls_insecure": bool(cfg.get("tls_insecure")),
        "configured": bool(cfg.get("hub_base_url")),
    }


# ---------------------------------------------------------------------------
# Hub HTTP
# ---------------------------------------------------------------------------

def _ssl_context(cfg: dict[str, Any]) -> ssl.SSLContext | None:
    base = cfg.get("hub_base_url") or ""
    if not base.startswith("https://"):
        return None
    ctx = ssl.create_default_context()
    if cfg.get("tls_insecure"):
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    return ctx


def hub_request(
    cfg: dict[str, Any],
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    auth: bool = True,
    timeout: float = HTTP_TIMEOUT,
) -> dict[str, Any]:
    """Call the remote hub. Never raises — returns a result dict."""
    base = cfg.get("hub_base_url") or ""
    if not base:
        return {"ok": False, "error": "hub_not_configured", "status": 0, "data": None}
    try:
        normalize_base(base)
    except ValueError as exc:
        return {"ok": False, "error": str(exc), "status": 0, "data": None}

    url = urljoin(base + "/", path.lstrip("/"))
    headers = {
        "Accept": "application/json, text/html;q=0.5, */*;q=0.1",
        "User-Agent": "Singularity-Termux-Companion/1.0",
    }
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if auth and cfg.get("hub_api_token"):
        headers["Authorization"] = f"Bearer {cfg['hub_api_token']}"
        headers["x-hub-token"] = str(cfg["hub_api_token"])

    req = UrlRequest(url, data=data, headers=headers, method=method.upper())
    try:
        with urlopen(req, timeout=timeout, context=_ssl_context(cfg)) as resp:
            raw = resp.read(MAX_BODY + 1)
            status = getattr(resp, "status", 200) or 200
            if len(raw) > MAX_BODY:
                return {"ok": False, "error": "response_too_large", "status": status, "data": None}
            text = raw.decode("utf-8", errors="replace")
            parsed: Any
            try:
                parsed = json.loads(text) if text else {}
            except json.JSONDecodeError:
                parsed = {"_text": text[:400], "_non_json": True}
            return {"ok": 200 <= status < 400, "error": None, "status": status, "data": parsed}
    except HTTPError as exc:
        raw = b""
        try:
            raw = exc.read(MAX_BODY)
        except Exception:
            pass
        text = raw.decode("utf-8", errors="replace") if raw else ""
        parsed: Any
        try:
            parsed = json.loads(text) if text else {}
        except json.JSONDecodeError:
            parsed = {"_text": text[:400]}
        err = ""
        if isinstance(parsed, dict):
            err = str(parsed.get("error") or parsed.get("reason") or "")
        return {
            "ok": False,
            "error": err or f"http_{exc.code}",
            "status": exc.code,
            "data": parsed,
        }
    except URLError as exc:
        reason = getattr(exc, "reason", exc)
        return {"ok": False, "error": f"unreachable: {reason}", "status": 0, "data": None}
    except TimeoutError:
        return {"ok": False, "error": "timeout", "status": 0, "data": None}
    except Exception as exc:  # noqa: BLE001 — surface any transport failure honestly
        return {"ok": False, "error": f"{type(exc).__name__}: {exc}"[:240], "status": 0, "data": None}


def ping_hub(cfg: dict[str, Any]) -> dict[str, Any]:
    """Reachability + auth state against real endpoints."""
    result: dict[str, Any] = {
        "reachable": False,
        "home_status": 0,
        "modules": None,
        "modules_error": None,
        "audit": None,
        "audit_error": None,
        "audit_auth": "unknown",
        "navigator": None,
        "navigator_error": None,
        "navigator_auth": "unknown",
        "error": None,
    }
    if not cfg.get("hub_base_url"):
        result["error"] = "hub_not_configured"
        return result

    home = hub_request(cfg, "GET", "/", auth=False)
    result["home_status"] = home["status"]
    result["reachable"] = bool(home["status"] and home["status"] < 500) or (
        home["status"] == 0 and False
    )
    # A 200/3xx/401/403/404 from the hub still means the host is up.
    if home["status"] and 200 <= home["status"] < 500:
        result["reachable"] = True
    elif home["error"]:
        result["error"] = home["error"]

    mods = hub_request(cfg, "GET", "/api/modules", auth=False)
    if mods["ok"] and isinstance(mods["data"], dict):
        result["modules"] = mods["data"]
    else:
        result["modules_error"] = mods["error"] or f"http_{mods['status']}"

    audit = hub_request(cfg, "GET", "/api/audit/timeline?limit=12")
    result["audit_auth"] = _auth_state(audit)
    if audit["ok"] and isinstance(audit["data"], dict):
        result["audit"] = audit["data"]
    else:
        result["audit_error"] = audit["error"] or f"http_{audit['status']}"

    nav = hub_request(cfg, "GET", "/api/offsec/attack-navigator")
    result["navigator_auth"] = _auth_state(nav)
    if nav["ok"] and isinstance(nav["data"], dict):
        result["navigator"] = nav["data"]
    else:
        result["navigator_error"] = nav["error"] or f"http_{nav['status']}"

    return result


def _auth_state(resp: dict[str, Any]) -> str:
    if resp["ok"]:
        return "ok"
    if resp["status"] == 401:
        return "unauthorized"
    if resp["status"] == 403:
        return "forbidden"
    if resp["status"] == 0:
        return "unreachable"
    return "error"


def extract_modules(ping: dict[str, Any]) -> list[dict[str, Any]]:
    data = ping.get("modules") or {}
    modules = data.get("modules") if isinstance(data, dict) else None
    if not isinstance(modules, list):
        return []
    out = []
    for raw in modules:
        if not isinstance(raw, dict):
            continue
        route = raw.get("route")
        nav = raw.get("nav") if isinstance(raw.get("nav"), dict) else {}
        out.append(
            {
                "id": str(raw.get("id") or ""),
                "name": str(raw.get("name") or raw.get("id") or "module"),
                "route": str(route) if route else "",
                "label": str(nav.get("label") or raw.get("name") or raw.get("id") or "module"),
                "group": str(nav.get("group") or ""),
            }
        )
    return out


def extract_audit(ping: dict[str, Any]) -> list[dict[str, Any]]:
    data = ping.get("audit") or {}
    entries = data.get("entries") if isinstance(data, dict) else None
    if not isinstance(entries, list):
        return []
    out = []
    for raw in entries[:12]:
        if not isinstance(raw, dict):
            continue
        ts = str(raw.get("ts") or "")
        out.append(
            {
                "ts": ts,
                "clock": ts[11:19] if len(ts) >= 19 else ts,
                "category": str(raw.get("category") or ""),
                "action": "sealed record" if raw.get("sealed") else str(raw.get("action") or ""),
                "source": str(raw.get("source") or ""),
                "sealed": bool(raw.get("sealed")),
            }
        )
    return out


def extract_techniques(ping: dict[str, Any]) -> tuple[list[dict[str, Any]], int | None]:
    data = ping.get("navigator") or {}
    if not isinstance(data, dict):
        return [], None
    techs = data.get("topTechniques") or []
    total = data.get("totalObserved")
    out = []
    if isinstance(techs, list):
        for raw in techs[:8]:
            if isinstance(raw, dict):
                out.append(
                    {
                        "id": str(raw.get("id") or ""),
                        "name": str(raw.get("name") or ""),
                        "hits": int(raw.get("hits") or 0),
                    }
                )
    events = int(total) if isinstance(total, (int, float)) else None
    return out, events


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

def _render(request: Request, name: str, **ctx: Any) -> HTMLResponse:
    cfg = load_config()
    context = {
        "request": request,
        "cfg": public_config(cfg),
        "flash": ctx.pop("flash", None),
        "flash_kind": ctx.pop("flash_kind", "info"),
        "nav": ctx.pop("nav", "deck"),
        **ctx,
    }
    return templates.TemplateResponse(name, context)


@app.get("/", response_class=HTMLResponse)
def deck(request: Request) -> HTMLResponse:
    cfg = load_config()
    if not cfg.get("hub_base_url"):
        return RedirectResponse("/setup", status_code=302)
    flash = None
    flash_kind = "info"
    if request.query_params.get("saved") == "1":
        flash = "Saved. Pinging the hub…"
        flash_kind = "ok"
    ping = ping_hub(cfg)
    modules = extract_modules(ping)
    techniques, events = extract_techniques(ping)
    return _render(
        request,
        "deck.html",
        nav="deck",
        flash=flash,
        flash_kind=flash_kind,
        ping=ping,
        modules=modules,
        audit=extract_audit(ping),
        techniques=techniques,
        events_observed=events,
        module_count=len(modules),
    )


@app.get("/api/deck.json")
def deck_json() -> JSONResponse:
    cfg = load_config()
    if not cfg.get("hub_base_url"):
        return JSONResponse({"ok": False, "error": "hub_not_configured"}, status_code=400)
    ping = ping_hub(cfg)
    techniques, events = extract_techniques(ping)
    return JSONResponse(
        {
            "ok": True,
            "cfg": public_config(cfg),
            "reachable": ping["reachable"],
            "home_status": ping["home_status"],
            "error": ping["error"],
            "modules": extract_modules(ping),
            "modules_error": ping["modules_error"],
            "audit": extract_audit(ping),
            "audit_auth": ping["audit_auth"],
            "audit_error": ping["audit_error"],
            "techniques": techniques,
            "events_observed": events,
            "navigator_auth": ping["navigator_auth"],
            "navigator_error": ping["navigator_error"],
        }
    )


@app.get("/setup", response_class=HTMLResponse)
def setup_get(request: Request) -> HTMLResponse:
    return _render(request, "setup.html", nav="setup")


@app.post("/setup", response_class=HTMLResponse)
def setup_post(
    request: Request,
    hub_base_url: str = Form(""),
    hub_api_token: str = Form(""),
    operator_name: str = Form(""),
    clear_token: str = Form(""),
    tls_insecure: str = Form(""),
) -> Any:
    cfg = load_config()
    try:
        base = normalize_base(hub_base_url)
    except ValueError as exc:
        return _render(
            request,
            "setup.html",
            nav="setup",
            flash=str(exc),
            flash_kind="error",
        )
    cfg["hub_base_url"] = base
    cfg["operator_name"] = (operator_name or "").strip() or "termux-op"
    cfg["tls_insecure"] = tls_insecure in {"1", "on", "true", "yes"}
    token = (hub_api_token or "").strip()
    if clear_token in {"1", "on"}:
        cfg["hub_api_token"] = ""
    elif token:
        cfg["hub_api_token"] = token
    # empty token field + no clear = leave existing token unchanged
    save_config(cfg)
    return RedirectResponse("/?saved=1", status_code=303)


@app.get("/health", response_class=HTMLResponse)
def health_page(request: Request) -> Any:
    return RedirectResponse("/", status_code=302)


@app.get("/api/health")
def health_json() -> JSONResponse:
    cfg = load_config()
    ping = ping_hub(cfg) if cfg.get("hub_base_url") else {
        "reachable": False,
        "error": "hub_not_configured",
        "home_status": 0,
        "audit_auth": "unknown",
        "navigator_auth": "unknown",
    }
    return JSONResponse(
        {
            "ok": True,
            "companion": "termux",
            "version": "1.0.0",
            "cfg": public_config(cfg),
            "reachable": ping.get("reachable"),
            "home_status": ping.get("home_status"),
            "error": ping.get("error"),
            "audit_auth": ping.get("audit_auth"),
            "navigator_auth": ping.get("navigator_auth"),
            "modules_error": ping.get("modules_error"),
        }
    )


@app.get("/redeem", response_class=HTMLResponse)
def redeem_get(request: Request) -> HTMLResponse:
    cfg = load_config()
    if not cfg.get("hub_base_url"):
        return RedirectResponse("/setup", status_code=302)
    return _render(request, "redeem.html", nav="redeem", result=None, mode="idle")


@app.post("/redeem", response_class=HTMLResponse)
def redeem_post(
    request: Request,
    code: str = Form(""),
    action: str = Form("check"),
    redeemed_by: str = Form(""),
) -> HTMLResponse:
    cfg = load_config()
    if not cfg.get("hub_base_url"):
        return RedirectResponse("/setup", status_code=302)
    raw_code = (code or "").strip()
    if len(raw_code) < 6:
        return _render(
            request,
            "redeem.html",
            nav="redeem",
            result=None,
            mode="idle",
            flash="Enter a full invite code (at least 6 characters).",
            flash_kind="error",
            last_code=raw_code,
        )

    redeem = action == "redeem"
    body: dict[str, Any] = {"code": raw_code, "redeem": redeem}
    who = (redeemed_by or cfg.get("operator_name") or "").strip()
    if who:
        body["redeemedBy"] = who[:120]

    # Verify/redeem is a public portal endpoint — do not attach the operator token.
    resp = hub_request(cfg, "POST", "/api/black-aurora/verify", body=body, auth=False)
    data = resp["data"] if isinstance(resp["data"], dict) else {}
    base = cfg["hub_base_url"]
    # Normalize code for URLs: uppercase, strip GhostNode:: prefix if present.
    url_code = raw_code.split("::")[-1].strip().upper().replace(" ", "")
    drop_url = f"{base}/black-aurora/drop/{url_code}"
    access_url = f"{base}/black-aurora/access/{url_code}"
    verify_url = f"{base}/black-aurora/verify"

    result = {
        "transport_ok": resp["status"] != 0,
        "status": resp["status"],
        "error": resp["error"],
        "data": data,
        "ok": bool(isinstance(data, dict) and data.get("ok")),
        "drop_url": drop_url,
        "access_url": access_url,
        "verify_url": verify_url,
        "redeemed": redeem,
        "code": raw_code,
        "url_code": url_code,
    }
    kind = "ok" if result["ok"] else "error"
    if redeem and result["ok"]:
        flash = "Invite redeemed. Use the access / drop links below. The download grant is short-lived."
    elif result["ok"]:
        flash = "Code looks valid (soft check — this did not consume a use)."
    elif redeem:
        flash = result["error"] or "Redeem failed."
    else:
        flash = result["error"] or "Code was not accepted."
    return _render(
        request,
        "redeem.html",
        nav="redeem",
        result=result,
        mode="redeem" if redeem else "check",
        flash=flash,
        flash_kind=kind,
        last_code=raw_code,
        last_name=who,
    )


@app.get("/presence", response_class=HTMLResponse)
def presence_get(request: Request) -> HTMLResponse:
    cfg = load_config()
    if not cfg.get("hub_base_url"):
        return RedirectResponse("/setup", status_code=302)
    resp = hub_request(cfg, "GET", "/api/signalframe/presence", auth=False)
    return _render(
        request,
        "presence.html",
        nav="presence",
        presence=resp["data"] if isinstance(resp["data"], dict) else None,
        presence_error=None if resp["ok"] else (resp["error"] or f"http_{resp['status']}"),
    )


@app.post("/presence", response_class=HTMLResponse)
def presence_post(
    request: Request,
    action: str = Form("heartbeat"),
    operator_name: str = Form(""),
    workspace: str = Form(""),
    engagement_id: str = Form(""),
    body: str = Form(""),
) -> Any:
    cfg = load_config()
    if not cfg.get("hub_base_url"):
        return RedirectResponse("/setup", status_code=302)

    name = (operator_name or cfg.get("operator_name") or "termux-op").strip()[:60]
    if name and name != cfg.get("operator_name"):
        cfg["operator_name"] = name
        save_config(cfg)

    flash = None
    flash_kind = "info"
    if action == "note":
        payload = {
            "action": "note",
            "engagementId": (engagement_id or "").strip()[:100],
            "from": name,
            "body": (body or "").strip()[:4000],
        }
        resp = hub_request(cfg, "POST", "/api/signalframe/presence", body=payload, auth=False)
        if resp["ok"] and isinstance(resp["data"], dict) and resp["data"].get("ok"):
            flash = "Note posted to the hub."
            flash_kind = "ok"
        else:
            err = resp["error"]
            if isinstance(resp["data"], dict):
                err = resp["data"].get("error") or err
            flash = f"Note failed: {err or 'unknown'}"
            flash_kind = "error"
    else:
        op_id = cfg.get("operator_id") or str(uuid.uuid4())
        payload = {
            "action": "heartbeat",
            "id": op_id,
            "name": name,
            "workspace": (workspace or "").strip() or None,
        }
        resp = hub_request(cfg, "POST", "/api/signalframe/presence", body=payload, auth=False)
        if resp["ok"] and isinstance(resp["data"], dict) and resp["data"].get("ok"):
            op = resp["data"].get("operator") or {}
            if isinstance(op, dict) and op.get("id"):
                cfg["operator_id"] = str(op["id"])
                cfg["operator_name"] = name
                save_config(cfg)
            flash = f"Heartbeat sent as {name}."
            flash_kind = "ok"
        else:
            err = resp["error"]
            if isinstance(resp["data"], dict):
                err = resp["data"].get("error") or err
            flash = f"Heartbeat failed: {err or 'unknown'}"
            flash_kind = "error"

    listing = hub_request(cfg, "GET", "/api/signalframe/presence", auth=False)
    return _render(
        request,
        "presence.html",
        nav="presence",
        presence=listing["data"] if isinstance(listing["data"], dict) else None,
        presence_error=None if listing["ok"] else (listing["error"] or f"http_{listing['status']}"),
        flash=flash,
        flash_kind=flash_kind,
        last_engagement=engagement_id,
    )


@app.get("/open", response_class=HTMLResponse)
def open_links(request: Request) -> HTMLResponse:
    cfg = load_config()
    if not cfg.get("hub_base_url"):
        return RedirectResponse("/setup", status_code=302)
    return _render(request, "open.html", nav="open")
