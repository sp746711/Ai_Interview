from __future__ import annotations

from typing import Any, Dict, List, Optional
import json
import re

import httpx


OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen3:4b"
OLLAMA_TIMEOUT = 240.0


class Round3FeedbackService:
    """
    Deterministic analytics service for Round 3 AI Interview.

    Responsibilities:
    - Aggregate real answered Round 3 responses.
    - Aggregate server-generated answer quality metrics.
    - Aggregate server-generated communication metrics.
    - Aggregate frontend-provided camera metrics when available.
    - Calculate interview presence from available real analytics.
    - Never create fake/default performance values.
    - Never include skipped questions in performance averages.

    This service does NOT use Ollama or any external AI model.
    """

    # =========================================================
    # PUBLIC METHOD
    # =========================================================

    @staticmethod
    def generate_feedback(responses: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Build the complete deterministic Round 3 analytics result.

        Parameters
        ----------
        responses:
            List of response documents stored in the interview.

        Returns
        -------
        dict
            Round 3 analytics suitable for `round3_result`.
        """

        if not isinstance(responses, list):
            responses = []

        answered_responses = [
            response
            for response in responses
            if isinstance(response, dict)
            and str(response.get("status", "")).lower() == "answered"
            and str(response.get("answer", "")).strip()
        ]

        answer_quality = Round3FeedbackService._aggregate_answer_quality(
            answered_responses
        )

        communication = Round3FeedbackService._aggregate_communication(
            answered_responses
        )

        camera_engagement = Round3FeedbackService._aggregate_camera_engagement(
            answered_responses
        )

        interview_presence = Round3FeedbackService._aggregate_interview_presence(
            answered_responses,
            answer_quality,
            communication,
            camera_engagement,
        )

        return {
            "answer_quality": answer_quality,
            "communication": communication,
            "camera_engagement": camera_engagement,
            "interview_presence": interview_presence,
        }

    # =========================================================
    # STEP 5 — QWEN QUALITATIVE FEEDBACK
    # =========================================================

    @staticmethod
    async def generate_qualitative_feedback(
        responses: Optional[List[Dict[str, Any]]],
        analytics: Optional[Dict[str, Any]],
        role: Optional[str] = None,
        interview_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate qualitative Round 3 feedback from the candidate's actual
        interview evidence using the configured local Qwen3:4b model.

        This method deliberately has NO predefined strengths, weaknesses,
        improvements, coaching, or summary. If Ollama fails or returns an
        unusable response, the method returns empty qualitative fields plus
        an explicit error/status instead of inventing feedback.
        """

        responses = responses if isinstance(responses, list) else []
        analytics = analytics if isinstance(analytics, dict) else {}

        answered = []
        for response in responses:
            if not isinstance(response, dict):
                continue
            status = str(response.get("status", "") or "").strip().lower()
            answer = str(
                response.get("answer", response.get("transcript", "")) or ""
            ).strip()
            if status == "answered" and answer:
                answered.append(response)

        if not answered:
            return {
                "strengths": [],
                "weaknesses": [],
                "improvements": [],
                "coaching": [],
                "summary": "",
                "llm_status": "no_evidence",
                "llm_error": "No answered Round 3 responses are available for qualitative analysis.",
                "generation_source": "none",
            }

        evidence = []
        for index, response in enumerate(answered, start=1):
            evidence.append({
                "question_number": response.get(
                    "question_number", response.get("questionNumber", index)
                ),
                "question": str(response.get("question", "") or "").strip(),
                "answer": str(
                    response.get("answer", response.get("transcript", "")) or ""
                ).strip()[:1800],
                "score": response.get("score"),
                "evaluation_feedback": str(
                    response.get("feedback", "") or ""
                ).strip()[:900],
                "answer_quality": response.get("answer_quality", {}),
                "communication": response.get("communication", {}),
                "camera_metrics": response.get("camera_metrics", {}),
                "duration_seconds": response.get("duration_seconds"),
            })

        evidence_text = json.dumps(
            evidence, ensure_ascii=False, separators=(",", ":")
        )
        # Bound total prompt evidence while preserving all questions in a
        # compact form. Individual answers are already bounded above.
        if len(evidence_text) > 14000:
            evidence_text = evidence_text[:14000]

        analytics_text = json.dumps(
            analytics, ensure_ascii=False, separators=(",", ":")
        )[:6000]

        selected_role = str(role or "").strip() or "Not specified"
        selected_type = str(interview_type or "").strip() or "technical"
        skipped_count = max(0, len(responses) - len(answered))

        prompt = f"""
You are the qualitative feedback engine for a mock interview platform.
Analyze ONLY the candidate evidence supplied below.

Candidate interview type: {selected_type}
Candidate target role/domain: {selected_role}
Answered questions: {len(answered)}
Skipped/unanswered saved responses: {skipped_count}

ROUND 3 NUMERIC ANALYTICS (already calculated from real data):
{analytics_text}

ACTUAL ANSWER EVIDENCE:
{evidence_text}

Rules:
1. Every statement must be grounded in the supplied answers, evaluations, or numeric analytics.
2. Do not invent skills, achievements, experience, projects, technologies, answers, transcripts, scores, or measurements.
3. Do not assume an answer contains information that is not present.
4. Use the numeric analytics as evidence, but do not repeat a metric unless it helps explain a qualitative conclusion.
5. Strengths must identify genuine strengths visible in this candidate's actual performance.
6. Weaknesses must identify genuine weaknesses visible in this candidate's actual performance.
7. Improvements must be specific actions directly addressing the observed weaknesses.
8. Coaching must be personalized practice guidance derived from the observed performance.
9. If evidence is insufficient for a point, omit that point instead of guessing.
10. Mention skipped questions only when they materially affect the interpretation.
11. Do not make medical, psychological, or mental-state diagnoses.
12. Confidence-related observations must be phrased as observable interview-performance evidence only.
13. Return at most 5 items in each list. Five is a maximum, not a requirement.
14. Each list item must be a complete, concise sentence.
15. The summary must describe this candidate's actual Round 3 performance, not a generic interview.
16. Return ONLY valid JSON.

Required JSON shape:
{{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."],
  "coaching": ["..."],
  "summary": "..."
}}
""".strip()

        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "think": False,
            "keep_alive": "10m",
            "options": {
                "temperature": 0.2,
                "num_predict": 1400,
                "num_ctx": 8192,
            },
        }

        try:
            timeout = httpx.Timeout(
                connect=10.0,
                read=OLLAMA_TIMEOUT,
                write=30.0,
                pool=10.0,
            )

            print(
                "TASK 18 STEP 5: calling Ollama "
                f"{OLLAMA_URL}/api/generate with {OLLAMA_MODEL}"
            )

            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json=payload,
                )

            response.raise_for_status()
            data = response.json()
            raw_output = str(data.get("response", "") or "").strip()

            parsed = Round3FeedbackService._extract_json_object(raw_output)
            normalized = Round3FeedbackService._normalize_qualitative_result(parsed)

            if not normalized["strengths"] and not normalized["weaknesses"] and not normalized["improvements"] and not normalized["coaching"] and not normalized["summary"]:
                raise ValueError("Qwen returned an empty qualitative feedback result.")

            normalized["llm_status"] = "success"
            normalized["llm_error"] = None
            normalized["generation_source"] = "qwen3:4b"
            return normalized

        except Exception as exc:
            print(
                "TASK 18 STEP 5 QWEN ERROR:",
                str(exc),
            )
            return {
                "strengths": [],
                "weaknesses": [],
                "improvements": [],
                "coaching": [],
                "summary": "",
                "llm_status": "error",
                "llm_error": str(exc),
                "generation_source": "qwen3:4b",
            }

    @staticmethod
    def _extract_json_object(raw_output: str) -> Dict[str, Any]:
        if not isinstance(raw_output, str) or not raw_output.strip():
            raise ValueError("Qwen returned an empty response.")

        text = raw_output.strip()
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)

        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass

        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            data = json.loads(text[start:end + 1])
            if isinstance(data, dict):
                return data

        raise ValueError("Qwen did not return a valid JSON object.")

    @staticmethod
    def _clean_qualitative_list(value: Any, limit: int = 5) -> List[str]:
        if isinstance(value, str):
            value = [value]
        if not isinstance(value, list):
            return []

        result = []
        seen = set()
        for item in value:
            if item is None:
                continue
            if isinstance(item, dict):
                item = item.get("text") or item.get("title") or item.get("tip") or ""
            text = re.sub(r"\s+", " ", str(item).strip())
            if not text:
                continue
            key = text.casefold()
            if key in seen:
                continue
            seen.add(key)
            result.append(text)
            if len(result) >= limit:
                break
        return result

    @staticmethod
    def _normalize_qualitative_result(data: Dict[str, Any]) -> Dict[str, Any]:
        strengths = Round3FeedbackService._clean_qualitative_list(
            data.get("strengths", [])
        )
        weaknesses = Round3FeedbackService._clean_qualitative_list(
            data.get("weaknesses", [])
        )
        improvements = Round3FeedbackService._clean_qualitative_list(
            data.get("improvements", data.get("areas_to_improve", []))
        )
        coaching = Round3FeedbackService._clean_qualitative_list(
            data.get("coaching", data.get("recommendations", []))
        )
        summary = data.get(
            "summary",
            data.get("final_summary", data.get("assessment_summary", "")),
        )
        summary = str(summary or "").strip()

        return {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "improvements": improvements,
            "coaching": coaching,
            "summary": summary,
        }

    # =========================================================
    # ANSWER QUALITY
    # =========================================================

    @staticmethod
    def _aggregate_answer_quality(
        responses: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Aggregate answer-quality metrics already calculated by AIService.

        Expected structure inside each response:

        answer_quality:
            {
                "score": ...,
                "relevance": ...,
                "completeness": ...,
                "technical_accuracy": ...,
                "examples_clarity": ...
            }

        The service does not recalculate the underlying answer-quality
        algorithm. It only aggregates the real values stored per response.
        """

        metric_names = [
            "relevance",
            "completeness",
            "technical_accuracy",
            "examples_clarity",
        ]

        values: Dict[str, List[float]] = {
            metric: [] for metric in metric_names
        }

        overall_scores: List[float] = []

        for response in responses:
            quality = response.get("answer_quality")

            if not isinstance(quality, dict):
                continue

            score = Round3FeedbackService._to_percentage(
                quality.get("score")
            )

            if score is not None:
                overall_scores.append(score)

            for metric in metric_names:
                value = Round3FeedbackService._to_percentage(
                    quality.get(metric)
                )

                if value is not None:
                    values[metric].append(value)

        result: Dict[str, Any] = {}

        score = Round3FeedbackService._average(overall_scores)

        if score is not None:
            result["score"] = score

        for metric in metric_names:
            average = Round3FeedbackService._average(values[metric])

            if average is not None:
                result[metric] = average

        return result

    # =========================================================
    # COMMUNICATION
    # =========================================================

    @staticmethod
    def _aggregate_communication(
        responses: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Aggregate communication metrics from the server evaluation
        and available stored communication data.

        Server-generated communication is preferred.

        Expected server communication structure may contain either the
        percentage fields or the raw speech measurements produced by
        AIService:

        communication:
            {
                "score": ...,
                "speaking_pace": ...,
                "speaking_pace_wpm": ...,
                "filler_words": ...,
                "filler_word_count": ...,
                "clarity": ...,
                "response_length": ...
            }

        When only raw measurements are available, this service converts
        them into the 0-100 scores required by the Feedback UI.
        """

        metric_names = [
            "speaking_pace",
            "filler_words",
            "clarity",
            "response_length",
        ]

        values: Dict[str, List[float]] = {
            metric: [] for metric in metric_names
        }

        overall_scores: List[float] = []

        for response in responses:

            # -------------------------------------------------
            # Primary source:
            # AIService server-generated communication
            # -------------------------------------------------
            communication = response.get("communication")

            if isinstance(communication, dict):

                score = Round3FeedbackService._to_percentage(
                    communication.get("score")
                )

                if score is not None:
                    overall_scores.append(score)

                # Speaking pace: prefer an already-normalized score.
                pace_score = Round3FeedbackService._to_percentage(
                    communication.get("speaking_pace")
                )

                if pace_score is None:
                    pace_wpm = communication.get("speaking_pace_wpm")
                    try:
                        pace_wpm = float(pace_wpm)
                    except (TypeError, ValueError):
                        pace_wpm = None

                    if pace_wpm is not None and pace_wpm > 0:
                        # 140 WPM is the target used by AIService.
                        pace_score = max(
                            50.0,
                            100.0 - abs(pace_wpm - 140.0) * 0.5,
                        )

                # If raw WPM was not persisted, derive it from the actual
                # answer word count and stored answer duration.
                if pace_score is None:
                    answer_text = str(response.get("answer", "")).strip()
                    duration = response.get("duration_seconds")
                    word_count = len(answer_text.split())
                    try:
                        duration = float(duration)
                    except (TypeError, ValueError):
                        duration = None

                    if duration is not None and duration > 0 and word_count > 0:
                        pace_wpm = (word_count / duration) * 60.0
                        pace_score = max(
                            50.0,
                            100.0 - abs(pace_wpm - 140.0) * 0.5,
                        )

                if pace_score is not None:
                    values["speaking_pace"].append(
                        Round3FeedbackService._clamp_percentage(pace_score)
                    )

                # Filler words: prefer a normalized percentage. Otherwise
                # use the real filler count and the real answer word count.
                filler_score = Round3FeedbackService._to_percentage(
                    communication.get("filler_words")
                )

                filler_count = communication.get("filler_word_count")
                try:
                    filler_count = float(filler_count)
                except (TypeError, ValueError):
                    filler_count = None

                if filler_score is None and filler_count is not None:
                    answer_text = str(response.get("answer", "")).strip()
                    word_count = len(answer_text.split())

                    stored_word_count = communication.get("word_count")
                    try:
                        stored_word_count = float(stored_word_count)
                    except (TypeError, ValueError):
                        stored_word_count = None

                    if stored_word_count is not None and stored_word_count > 0:
                        word_count = stored_word_count

                    if word_count > 0:
                        filler_rate = (filler_count / word_count) * 100.0
                        filler_score = 100.0 - (filler_rate * 10.0)

                # Last real-data fallback: count the same common filler
                # expressions directly from the stored transcript.
                if filler_score is None:
                    answer_text = str(response.get("answer", "")).strip()
                    words = len(answer_text.split())
                    if words > 0:
                        filler_pattern = re.compile(
                            r"\b(?:um|uh|like|actually|basically)\b|\byou\s+know\b",
                            re.IGNORECASE,
                        )
                        filler_count_from_text = len(
                            filler_pattern.findall(answer_text)
                        )
                        filler_rate = (filler_count_from_text / words) * 100.0
                        filler_score = 100.0 - (filler_rate * 10.0)

                if filler_score is not None:
                    values["filler_words"].append(
                        Round3FeedbackService._clamp_percentage(filler_score)
                    )

                for metric in ("clarity", "response_length"):
                    value = Round3FeedbackService._to_percentage(
                        communication.get(metric)
                    )

                    if value is not None:
                        values[metric].append(value)

            # -------------------------------------------------
            # Fallback:
            # Frontend communication metrics
            #
            # Only use fields that actually exist.
            # No fake values are generated.
            # -------------------------------------------------
            frontend_metrics = response.get("communication_metrics")

            if isinstance(frontend_metrics, dict):

                for metric in metric_names:

                    if values[metric]:
                        continue

                    value = Round3FeedbackService._to_percentage(
                        frontend_metrics.get(metric)
                    )

                    if value is not None:
                        values[metric].append(value)

        result: Dict[str, Any] = {}

        score = Round3FeedbackService._average(overall_scores)

        if score is not None:
            result["score"] = score

        for metric in metric_names:
            average = Round3FeedbackService._average(values[metric])

            if average is not None:
                result[metric] = average

        return result

    # =========================================================
    # CAMERA ENGAGEMENT
    # =========================================================

    @staticmethod
    def _aggregate_camera_engagement(
        responses: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Aggregate camera metrics supplied by the interview frontend.

        Expected camera_metrics may contain:

            face_visibility
            eye_contact
            looking_away
            camera_stability
            score

        The values are only included when real observations exist.

        NOTE:
        The current frontend uses face detection. Therefore eye_contact
        should represent an estimated/proxy measurement rather than
        claiming true gaze tracking.
        """

        metric_names = [
            "face_visibility",
            "eye_contact",
            "looking_away",
            "camera_stability",
        ]

        values: Dict[str, List[float]] = {
            metric: [] for metric in metric_names
        }

        overall_scores: List[float] = []

        for response in responses:

            camera = response.get("camera_metrics")

            if not isinstance(camera, dict):
                continue

            score = Round3FeedbackService._to_percentage(
                camera.get("score")
            )

            if score is not None:
                overall_scores.append(score)

            for metric in metric_names:

                value = Round3FeedbackService._to_percentage(
                    camera.get(metric)
                )

                if value is not None:
                    values[metric].append(value)

        result: Dict[str, Any] = {}

        score = Round3FeedbackService._average(overall_scores)

        # -----------------------------------------------------
        # If camera metrics contain component values but no
        # explicit score, calculate score from available
        # components only.
        # -----------------------------------------------------
        if score is None:
            component_averages = [
                Round3FeedbackService._average(values[metric])
                for metric in metric_names
            ]

            component_averages = [
                value
                for value in component_averages
                if value is not None
            ]

            score = Round3FeedbackService._average(component_averages)

        if score is not None:
            result["score"] = score

        for metric in metric_names:

            average = Round3FeedbackService._average(values[metric])

            if average is not None:
                result[metric] = average

        return result

    # =========================================================
    # INTERVIEW PRESENCE
    # =========================================================

    @staticmethod
    def _aggregate_interview_presence(
        responses: List[Dict[str, Any]],
        answer_quality: Dict[str, Any],
        communication: Dict[str, Any],
        camera_engagement: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Build Interview Presence from available real Round 3 analytics.

        Presence is not treated as a psychological diagnosis or factual
        measurement of confidence. `confidence_estimated` is explicitly
        an estimate derived from observable interview metrics.

        Components:
            - consistency
            - confidence_estimated
            - engagement
            - overall_presence
        """

        result: Dict[str, Any] = {}

        # -----------------------------------------------------
        # Consistency
        #
        # Uses answer scores across answered questions.
        # -----------------------------------------------------
        answer_scores = []

        for response in responses:
            score = Round3FeedbackService._to_percentage(
                response.get("score")
            )

            if score is not None:
                answer_scores.append(score)

        consistency = Round3FeedbackService._calculate_consistency(
            answer_scores
        )

        if consistency is not None:
            result["consistency"] = consistency

        # -----------------------------------------------------
        # Engagement
        #
        # Prefer camera engagement when available.
        # Otherwise use communication/answer quality only if
        # actual values exist.
        # -----------------------------------------------------
        engagement_candidates = []

        camera_score = camera_engagement.get("score")

        if isinstance(camera_score, (int, float)):
            engagement_candidates.append(float(camera_score))

        communication_score = communication.get("score")

        if isinstance(communication_score, (int, float)):
            engagement_candidates.append(float(communication_score))

        engagement = Round3FeedbackService._average(
            engagement_candidates
        )

        if engagement is not None:
            result["engagement"] = engagement

        # -----------------------------------------------------
        # Confidence estimated
        #
        # This is an observable-performance estimate only.
        # It is NOT a claim about the candidate's mental state.
        # -----------------------------------------------------
        confidence_candidates = []

        if isinstance(communication_score, (int, float)):
            confidence_candidates.append(float(communication_score))

        if isinstance(camera_score, (int, float)):
            confidence_candidates.append(float(camera_score))

        if consistency is not None:
            confidence_candidates.append(consistency)

        confidence_estimated = Round3FeedbackService._average(
            confidence_candidates
        )

        if confidence_estimated is not None:
            result["confidence_estimated"] = confidence_estimated

        # -----------------------------------------------------
        # Overall presence
        #
        # Average only the real available component scores.
        # -----------------------------------------------------
        presence_components = []

        if consistency is not None:
            presence_components.append(consistency)

        if confidence_estimated is not None:
            presence_components.append(confidence_estimated)

        if engagement is not None:
            presence_components.append(engagement)

        if isinstance(answer_quality.get("score"), (int, float)):
            presence_components.append(
                float(answer_quality["score"])
            )

        overall_presence = Round3FeedbackService._average(
            presence_components
        )

        if overall_presence is not None:
            result["overall_presence"] = overall_presence
            result["score"] = overall_presence

        return result

    # =========================================================
    # CONSISTENCY
    # =========================================================

    @staticmethod
    def _calculate_consistency(
        scores: List[float],
    ) -> Optional[float]:
        """
        Calculate consistency from answered-question scores.

        A perfect consistency score means the answer scores are very
        close to each other.

        If there are fewer than two valid answer scores, consistency
        cannot be meaningfully calculated and is therefore omitted.
        """

        if len(scores) < 2:
            return None

        average = sum(scores) / len(scores)

        if average <= 0:
            return 0.0

        mean_absolute_deviation = sum(
            abs(score - average)
            for score in scores
        ) / len(scores)

        # Convert deviation into a 0-100 consistency value.
        consistency = 100.0 - mean_absolute_deviation

        return Round3FeedbackService._clamp_percentage(
            consistency
        )

    # =========================================================
    # NUMERIC HELPERS
    # =========================================================

    @staticmethod
    def _to_percentage(value: Any) -> Optional[float]:
        """
        Convert a numeric metric into a 0-100 percentage.

        Supported input:
            0-1   -> converted to 0-100
            0-100 -> kept as 0-100

        Missing/non-numeric values return None.
        """

        if value is None:
            return None

        try:
            number = float(value)
        except (TypeError, ValueError):
            return None

        if number != number:
            return None

        # -----------------------------------------------------
        # Fraction format
        # Example: 0.85 -> 85
        # -----------------------------------------------------
        if 0 <= number <= 1:
            number *= 100

        return Round3FeedbackService._clamp_percentage(number)

    @staticmethod
    def _clamp_percentage(value: float) -> float:
        """Keep a percentage between 0 and 100."""

        return round(
            max(0.0, min(100.0, float(value))),
            2,
        )

    @staticmethod
    def _average(values: List[float]) -> Optional[float]:
        """
        Calculate an average only when real values are available.
        """

        if not values:
            return None

        numeric_values = []

        for value in values:
            try:
                numeric_values.append(float(value))
            except (TypeError, ValueError):
                continue

        if not numeric_values:
            return None

        return round(
            sum(numeric_values) / len(numeric_values),
            2,
        )
