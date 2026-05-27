"""
AI Service abstraction layer.

Provider priority:
    1. Groq (if GROQ_API_KEY is set)
    2. Anthropic Claude (if ANTHROPIC_API_KEY is set)
    3. OpenAI (if OPENAI_API_KEY is set)
    4. Local heuristic fallback (always available)

Adding a new provider: implement the _call_<provider> function and add it
to the provider chain in _call_llm().
"""
from __future__ import annotations

import json
import math
import os
import re
from typing import Any


# ─── Provider helpers ─────────────────────────────────────────────────────────

async def _call_anthropic(prompt: str, system: str, max_tokens: int = 1024) -> str | None:
    """Call Anthropic Claude API. Returns text or None on failure."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import httpx  # type: ignore
        payload = {
            "model": "claude-3-haiku-20240307",
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": prompt}],
        }
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
            )
            r.raise_for_status()
            data = r.json()
            return data["content"][0]["text"]
    except Exception:
        return None


async def _call_groq(prompt: str, system: str, max_tokens: int = 1024) -> str | None:
    """Call Groq's OpenAI-compatible API. Returns text or None on failure."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        import httpx  # type: ignore
        payload = {
            "model": "llama-3.1-8b-instant",
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        }
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "content-type": "application/json",
                },
            )
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]
    except Exception:
        return None


async def _call_openai(prompt: str, system: str, max_tokens: int = 1024) -> str | None:
    """Call OpenAI Chat API. Returns text or None on failure."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        import httpx  # type: ignore
        payload = {
            "model": "gpt-4o-mini",
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        }
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "content-type": "application/json",
                },
            )
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]
    except Exception:
        return None


async def _call_llm(prompt: str, system: str, max_tokens: int = 1024) -> str | None:
    """Try providers in priority order. Returns text or None if all fail."""
    result = await _call_groq(prompt, system, max_tokens)
    if result:
        return result
    result = await _call_anthropic(prompt, system, max_tokens)
    if result:
        return result
    result = await _call_openai(prompt, system, max_tokens)
    return result


def _safe_json(text: str) -> Any | None:
    """Extract and parse the first JSON object/array found in text."""
    try:
        return json.loads(text)
    except Exception:
        pass
    # Try to find JSON block inside markdown code fences
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
    # Try to extract first { ... } or [ ... ]
    for pattern in (r"(\{[\s\S]+\})", r"(\[[\s\S]+\])"):
        match = re.search(pattern, text)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return None


# ─── Brief Generation ─────────────────────────────────────────────────────────

_BRIEF_SYSTEM = (
    "You are a freelance project brief writer. "
    "Given a short description, return ONLY a JSON object with exactly these keys: "
    "title (string), description (string, 3-5 sentences), skills (array of strings, 3-8 items), "
    "budget_min (integer USD), budget_max (integer USD), timeline_days (integer), "
    "next_step (string, 1 sentence action for the client). "
    "No markdown, no explanation — just the JSON object."
)


def _heuristic_brief(prompt: str) -> dict:
    """Generate a structured brief using simple heuristics."""
    words = prompt.lower().split()
    
    # Detect common skill keywords
    skill_keywords = {
        "react": "React", "node": "Node.js", "python": "Python", "django": "Django",
        "fastapi": "FastAPI", "typescript": "TypeScript", "javascript": "JavaScript",
        "figma": "Figma", "design": "UI/UX Design", "mobile": "Mobile Development",
        "flutter": "Flutter", "aws": "AWS", "docker": "Docker", "sql": "SQL",
        "postgres": "PostgreSQL", "mysql": "MySQL", "mongodb": "MongoDB",
        "api": "REST API", "graphql": "GraphQL", "ml": "Machine Learning",
        "ai": "AI/ML", "devops": "DevOps", "nextjs": "Next.js", "vue": "Vue.js",
        "wordpress": "WordPress", "shopify": "Shopify", "stripe": "Stripe",
    }
    detected_skills = []
    for word in words:
        clean = word.strip(".,!?;:")
        if clean in skill_keywords and skill_keywords[clean] not in detected_skills:
            detected_skills.append(skill_keywords[clean])

    if not detected_skills:
        detected_skills = ["Web Development", "Frontend", "Backend"]

    # Rough budget/timeline based on complexity words
    complexity = sum(1 for w in ["complex", "large", "enterprise", "full", "complete", "entire", "advanced"] if w in words)
    if complexity >= 2:
        bmin, bmax, days = 3000, 8000, 60
    elif complexity == 1:
        bmin, bmax, days = 1500, 4000, 30
    else:
        bmin, bmax, days = 500, 2000, 14

    # Capitalise first letter of prompt for title
    title_words = prompt.strip().rstrip(".").split()
    title = " ".join(title_words[:8]).title() if title_words else "Custom Development Project"

    return {
        "title": title,
        "description": (
            f"{prompt.strip()} "
            "The project requires clear deliverables and regular check-ins to ensure quality. "
            "The freelancer should be experienced with the required technologies and able to work independently. "
            "Communication and documentation are important throughout the engagement."
        ),
        "skills": detected_skills[:8],
        "budget_min": bmin,
        "budget_max": bmax,
        "timeline_days": days,
        "next_step": "Review the brief, adjust budget and timeline to fit your needs, then post the project to start receiving proposals.",
    }


async def generate_brief(prompt: str) -> dict:
    """Return a structured project brief dict from a short prompt."""
    llm_text = await _call_llm(
        prompt=f"Client description: {prompt}",
        system=_BRIEF_SYSTEM,
        max_tokens=600,
    )
    if llm_text:
        parsed = _safe_json(llm_text)
        if parsed and isinstance(parsed, dict) and "title" in parsed:
            # Ensure required fields exist
            parsed.setdefault("skills", [])
            parsed.setdefault("budget_min", 500)
            parsed.setdefault("budget_max", 2000)
            parsed.setdefault("timeline_days", 14)
            parsed.setdefault("next_step", "Post your project to receive proposals.")
            return parsed

    # Fallback to heuristic
    return _heuristic_brief(prompt)


# ─── Freelancer Matching ──────────────────────────────────────────────────────

_MATCH_SYSTEM = (
    "You are a freelancer matching assistant. "
    "Given a project and a list of freelancers, score and rank them. "
    "Return ONLY a JSON array. Each element must have: "
    "freelancer_id (int), match_score (int 0-100), match_reason (string, 1-2 sentences). "
    "No markdown, no explanation."
)


def _token_overlap(a_terms: list[str], b_terms: list[str]) -> float:
    """Jaccard-like overlap between two term sets."""
    a_set = {t.lower() for t in a_terms if len(t) > 2}
    b_set = {t.lower() for t in b_terms if len(t) > 2}
    if not a_set or not b_set:
        return 0.0
    intersection = len(a_set & b_set)
    union = len(a_set | b_set)
    return intersection / union if union else 0.0


def _heuristic_match(project: dict, freelancers: list[dict]) -> list[dict]:
    """Score freelancers against a project using heuristics."""
    proj_skills = [s.lower() for s in (project.get("skills") or [])]
    proj_terms = " ".join([
        project.get("title", ""),
        project.get("description", ""),
        " ".join(proj_skills),
    ]).lower().split()
    proj_budget_max = project.get("budget_max") or 0

    scored = []
    for fl in freelancers:
        fl_skills = [s.lower() for s in (fl.get("skills") or [])]
        fl_terms = " ".join([fl.get("title", ""), fl.get("bio", ""), " ".join(fl_skills)]).lower().split()

        # Skill overlap (0-40 pts)
        skill_overlap = _token_overlap(proj_skills, fl_skills)
        skill_pts = int(skill_overlap * 40)

        # Title/bio similarity (0-20 pts)
        text_overlap = _token_overlap(proj_terms, fl_terms)
        text_pts = int(text_overlap * 20)

        # Portfolio presence (0-10 pts)
        portfolio_pts = min(fl.get("portfolio_count", 0) * 3, 10)

        # Verification bonus (0-10 pts)
        verified_pts = 10 if fl.get("verified") else 0

        # Rating bonus (0-10 pts)
        rating = fl.get("avg_rating") or 0
        rating_pts = int((rating / 5.0) * 10) if rating else 0

        # Budget fit (0-10 pts) — penalise if hourly rate implies > budget
        budget_pts = 0
        rate = fl.get("hourly_rate") or 0
        if rate and proj_budget_max:
            implied_cost = rate * 40  # ~1 week
            if implied_cost <= proj_budget_max:
                budget_pts = 10
            elif implied_cost <= proj_budget_max * 1.5:
                budget_pts = 5
        else:
            budget_pts = 5  # neutral when no data

        score = skill_pts + text_pts + portfolio_pts + verified_pts + rating_pts + budget_pts
        score = min(100, max(0, score))

        # Build reason
        reasons = []
        if skill_overlap > 0.3:
            matched = [s for s in (fl.get("skills") or []) if s.lower() in proj_skills]
            reasons.append(f"Strong skill match: {', '.join(matched[:3])}")
        elif skill_overlap > 0:
            reasons.append("Partial skill overlap with project requirements")
        if fl.get("verified"):
            reasons.append("verified freelancer")
        if rating >= 4.5:
            reasons.append(f"{rating:.1f}★ rating")
        if fl.get("portfolio_count", 0) >= 2:
            reasons.append(f"{fl['portfolio_count']} portfolio items")
        if not reasons:
            reasons.append("General experience may be relevant")

        reason = ". ".join(r.capitalize() for r in reasons[:3]) + "."

        scored.append({
            "freelancer_id": fl["freelancer_id"],
            "match_score": score,
            "match_reason": reason,
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored


async def match_freelancers(project: dict, freelancers: list[dict]) -> list[dict]:
    """
    Return scoring list [{freelancer_id, match_score, match_reason}, ...] sorted descending.
    Tries LLM first; falls back to heuristic.
    """
    if not freelancers:
        return []

    # LLM path
    prompt_data = {
        "project": {
            "title": project.get("title"),
            "description": (project.get("description") or "")[:300],
            "skills": project.get("skills", []),
            "budget_max": project.get("budget_max"),
        },
        "freelancers": [
            {
                "freelancer_id": fl["freelancer_id"],
                "title": fl.get("title"),
                "skills": fl.get("skills", []),
                "verified": fl.get("verified", False),
                "avg_rating": fl.get("avg_rating"),
            }
            for fl in freelancers
        ],
    }
    llm_text = await _call_llm(
        prompt=json.dumps(prompt_data),
        system=_MATCH_SYSTEM,
        max_tokens=800,
    )
    if llm_text:
        parsed = _safe_json(llm_text)
        if parsed and isinstance(parsed, list) and all("freelancer_id" in x for x in parsed):
            return sorted(parsed, key=lambda x: x.get("match_score", 0), reverse=True)

    return _heuristic_match(project, freelancers)
