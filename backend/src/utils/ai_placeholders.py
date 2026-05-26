from __future__ import annotations

from typing import Iterable


def score_proposal_placeholder(project_terms: Iterable[str], cover_message: str) -> int:
    """Placeholder scoring logic until a real model is wired in."""
    cover_terms = cover_message.lower()
    overlap_score = sum(1 for token in set(project_terms) if len(token) > 3 and token in cover_terms)
    base = 55
    length_bonus = min(len(cover_message) // 40, 10)
    return min(100, base + overlap_score * 7 + length_bonus)


def match_freelancers_placeholder() -> list[dict]:
    """Static placeholder for future AI matching integration."""
    return [
        {"freelancer_id": 1, "score": 92},
        {"freelancer_id": 2, "score": 89},
        {"freelancer_id": 3, "score": 84},
        {"freelancer_id": 4, "score": 81},
        {"freelancer_id": 5, "score": 78},
    ]


def generate_skill_test_placeholder(skill_name: str) -> list[dict]:
    """Deterministic placeholder skill test generator."""
    normalized = (skill_name or "skill").strip() or "skill"
    base = normalized.title()
    questions: list[dict] = []
    for index in range(1, 11):
        correct_answer = f"{base} concept {index}"
        questions.append(
            {
                "question": f"Which statement best describes {base} topic {index}?",
                "options": [
                    correct_answer,
                    f"Unrelated {base} option {index}",
                    f"Generic workflow option {index}",
                    f"Misleading {base} answer {index}",
                ],
                "correct_answer": correct_answer,
            }
        )
    return questions
