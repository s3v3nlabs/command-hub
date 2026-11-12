"""Evidence-category labels used across Singular/ty work.

These are honesty labels, not a claim about the underlying event:
  OBSERVED    — raw metadata recorded in the index (role, timestamp, id)
  DOCUMENTED  — verbatim text present in a vaulted export / ingest
  CORRELATED  — two documented facts joined by a shared identifier
  INFERRED    — a conclusion the operator or a model drew; not used here
  PREDICTED   — a forecast; not used here
"""

from __future__ import annotations

LABELS = ("OBSERVED", "DOCUMENTED", "CORRELATED", "INFERRED", "PREDICTED")

# Search hits and conversation bodies are text that exists in the export.
HIT_LABEL = "DOCUMENTED"
# Conversation titles, roles, timestamps, counts come from recorded metadata.
META_LABEL = "OBSERVED"


def annotate_hit(hit: dict) -> dict:
    out = dict(hit)
    out.setdefault("evidence", HIT_LABEL)
    out.setdefault("meta_evidence", META_LABEL)
    return out
