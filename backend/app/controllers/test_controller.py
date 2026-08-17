from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.schemas.test_schema import TestSubmit
from bson import ObjectId


class TestController:

    @staticmethod
    def _safe_lower(value, default: str) -> str:
        if value is None:
            return default

        return str(value).strip().lower() or default

    # =========================================================
    # GET ROUND 2 QUESTIONS
    # =========================================================

    @staticmethod
    async def get_questions(
        interview_id: str,
        interview_type: str,
        difficulty: str = "easy",
        db: AsyncIOMotorDatabase = None
    ):

        if db is None:
            raise HTTPException(
                status_code=500,
                detail="Database dependency missing"
            )

        # -----------------------------------------------------
        # 1. VALIDATE INTERVIEW ID
        # -----------------------------------------------------

        try:
            oid = ObjectId(interview_id)

        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid interview id"
            )

        # -----------------------------------------------------
        # 2. FIND INTERVIEW
        # -----------------------------------------------------

        interview = await db["interviews"].find_one({
            "_id": oid
        })

        if not interview:
            raise HTTPException(
                status_code=404,
                detail="Interview not found"
            )

        # -----------------------------------------------------
        # 3. NORMALIZE INTERVIEW TYPE
        # -----------------------------------------------------

        normalized_type = TestController._safe_lower(
            interview_type,
            "technical"
        )

        if normalized_type not in [
            "technical",
            "non-technical"
        ]:
            raise HTTPException(
                status_code=400,
                detail="Interview type must be technical or non-technical"
            )

        # -----------------------------------------------------
        # 4. RETURN EXISTING QUESTION SET
        #
        # Important:
        # Do not generate another question set when the frontend
        # calls this endpoint again for the same interview.
        # -----------------------------------------------------

        existing_questions = interview.get("test_questions")
        existing_type = interview.get("test_interview_type")

        if (
            existing_questions
            and existing_type == normalized_type
        ):

            response_questions = []

            for q in existing_questions:

                response_questions.append({
                    "mongo_id": q.get("mongo_id"),
                    "category": q.get("category"),
                    "question": q.get("question", ""),
                    "options": q.get("options", [])
                })

            return {
                "questions": response_questions,
                "total_questions": len(response_questions),
                "interview_type": normalized_type
            }

        # -----------------------------------------------------
        # 5. GET 10 APTITUDE QUESTIONS
        # -----------------------------------------------------

        aptitude = await db["aptitude_questions"].aggregate([
            {
                "$sample": {
                    "size": 10
                }
            }
        ]).to_list(length=10)

        # -----------------------------------------------------
        # 6. GET 10 REASONING QUESTIONS
        # -----------------------------------------------------

        reasoning = await db["reasoning_questions"].aggregate([
            {
                "$sample": {
                    "size": 10
                }
            }
        ]).to_list(length=10)

        # -----------------------------------------------------
        # 7. GET 30 MAIN QUESTIONS
        #
        # TECHNICAL:
        #     30 Technical
        #
        # NON-TECHNICAL:
        #     30 Verbal
        # -----------------------------------------------------

        if normalized_type == "technical":

            main_questions = await db["tests"].aggregate([
                {
                    "$sample": {
                        "size": 30
                    }
                }
            ]).to_list(length=30)

            main_category = "technical"

        else:

            main_questions = await db["verbal_questions"].aggregate([
                {
                    "$sample": {
                        "size": 30
                    }
                }
            ]).to_list(length=30)

            main_category = "verbal"

        # -----------------------------------------------------
        # 8. VERIFY QUESTION COUNTS
        # -----------------------------------------------------

        if len(aptitude) < 10:
            raise HTTPException(
                status_code=500,
                detail="Not enough aptitude questions available"
            )

        if len(reasoning) < 10:
            raise HTTPException(
                status_code=500,
                detail="Not enough reasoning questions available"
            )

        if len(main_questions) < 30:
            raise HTTPException(
                status_code=500,
                detail=f"Not enough {main_category} questions available"
            )

        # -----------------------------------------------------
        # 9. ADD CATEGORY INFORMATION
        # -----------------------------------------------------

        for q in aptitude:
            q["category"] = "aptitude"

        for q in reasoning:
            q["category"] = "reasoning"

        for q in main_questions:
            q["category"] = main_category

        # -----------------------------------------------------
        # 10. COMBINE ALL 50 QUESTIONS
        # -----------------------------------------------------

        questions = (
            aptitude
            + reasoning
            + main_questions
        )

        # -----------------------------------------------------
        # 11. SAVE COMPLETE QUESTIONS IN INTERVIEW
        #
        # Correct answers stay in MongoDB.
        # They are NOT sent to the frontend.
        #
        # Task 16 uses these exact questions and answers
        # when calculating the Round 2 result.
        # -----------------------------------------------------

        stored_questions = []

        for index, q in enumerate(questions):

            stored_questions.append({
                "index": index + 1,
                "mongo_id": str(q["_id"]),
                "category": q.get("category"),
                "question": q.get("question", ""),
                "options": q.get("options", []),
                "answer": q.get("answer", "")
            })

        # -----------------------------------------------------
        # 12. SAVE QUESTION SET TO INTERVIEW
        # -----------------------------------------------------

        await db["interviews"].update_one(
            {
                "_id": oid
            },
            {
                "$set": {
                    "test_questions": stored_questions,
                    "test_interview_type": normalized_type,
                    "test_total_questions": 50
                }
            }
        )

        # -----------------------------------------------------
        # 13. PREPARE SAFE FRONTEND RESPONSE
        #
        # NEVER SEND "answer" TO FRONTEND.
        # -----------------------------------------------------

        response_questions = []

        for q in stored_questions:

            response_questions.append({
                "mongo_id": q["mongo_id"],
                "category": q["category"],
                "question": q["question"],
                "options": q["options"]
            })

        # -----------------------------------------------------
        # 14. RETURN QUESTIONS
        # -----------------------------------------------------

        return {
            "questions": response_questions,
            "total_questions": len(response_questions),
            "interview_type": normalized_type
        }

    # =========================================================
    # SUBMIT ROUND 2 TEST
    # =========================================================

    @staticmethod
    async def submit_test(
        data: TestSubmit,
        db: AsyncIOMotorDatabase
    ):

        # -----------------------------------------------------
        # 1. VALIDATE INTERVIEW ID
        # -----------------------------------------------------

        try:
            oid = ObjectId(data.interview_id)

        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid interview id"
            )

        # -----------------------------------------------------
        # 2. FIND INTERVIEW
        # -----------------------------------------------------

        interview = await db["interviews"].find_one({
            "_id": oid
        })

        if not interview:
            raise HTTPException(
                status_code=404,
                detail="Interview not found"
            )

        # -----------------------------------------------------
        # 3. CHECK TEST STAGE
        # -----------------------------------------------------

        if interview.get("stage") != "test":

            raise HTTPException(
                status_code=409,
                detail="Test stage is not active"
            )

        # -----------------------------------------------------
        # 4. SANITIZE USER ANSWERS
        # -----------------------------------------------------

        safe_answers = {}

        for key, value in (data.answers or {}).items():

            safe_answers[str(key)] = (
                ""
                if value is None
                else str(value)
            )

        # -----------------------------------------------------
        # 5. GET STORED QUESTION SET
        #
        # Task 16:
        # Score the exact 50 questions assigned to
        # this interview attempt.
        # -----------------------------------------------------

        stored_questions = interview.get(
            "test_questions",
            []
        )

        if not stored_questions:

            raise HTTPException(
                status_code=409,
                detail="Round 2 question set not found"
            )

        # -----------------------------------------------------
        # 6. CALCULATE ROUND 2 RESULT
        # -----------------------------------------------------

        total_questions = len(stored_questions)

        correct_count = 0
        incorrect_count = 0
        skipped_count = 0

        category_totals = {
            "reasoning": 0,
            "aptitude": 0,
            "technical": 0,
            "verbal": 0
        }

        category_correct = {
            "reasoning": 0,
            "aptitude": 0,
            "technical": 0,
            "verbal": 0
        }

        category_skipped = {
            "reasoning": 0,
            "aptitude": 0,
            "technical": 0,
            "verbal": 0
        }

        question_results = []

        # -----------------------------------------------------
        # CHECK EVERY QUESTION
        # -----------------------------------------------------

        for question in stored_questions:

            question_number = question.get("index")

            question_id = str(
                question.get("mongo_id", "")
            )

            category = TestController._safe_lower(
                question.get("category"),
                "unknown"
            )

            correct_answer = str(
                question.get("answer", "")
            ).strip()

            # -------------------------------------------------
            # FIND USER ANSWER
            #
            # Supports:
            # 1. MongoDB question ID
            # 2. Question number
            # 3. Question text
            # -------------------------------------------------

            selected_answer = str(
                safe_answers.get(
                    question_id,
                    ""
                )
            ).strip()

            # -------------------------------------------------
            # FALLBACK 1:
            # ANSWER KEYED BY QUESTION NUMBER
            # -------------------------------------------------

            if (
                not selected_answer
                and question_number is not None
            ):

                selected_answer = str(
                    safe_answers.get(
                        str(question_number),
                        ""
                    )
                ).strip()

            # -------------------------------------------------
            # FALLBACK 2:
            # ANSWER KEYED BY QUESTION TEXT
            #
            # Test.jsx currently sends:
            #
            # answers[q.question] = selectedValue
            #
            # Therefore this is required.
            # -------------------------------------------------

            if not selected_answer:

                question_text = str(
                    question.get("question", "")
                ).strip()

                if question_text:

                    selected_answer = str(
                        safe_answers.get(
                            question_text,
                            ""
                        )
                    ).strip()

            # -------------------------------------------------
            # CATEGORY TOTAL
            # -------------------------------------------------

            if category in category_totals:
                category_totals[category] += 1

            # -------------------------------------------------
            # RESULT
            # -------------------------------------------------

            if not selected_answer:

                result_status = "skipped"

                skipped_count += 1

                if category in category_skipped:
                    category_skipped[category] += 1

            elif (
                selected_answer.lower()
                == correct_answer.lower()
            ):

                result_status = "correct"

                correct_count += 1

                if category in category_correct:
                    category_correct[category] += 1

            else:

                result_status = "incorrect"

                incorrect_count += 1

            # -------------------------------------------------
            # QUESTION RESULT
            # -------------------------------------------------

            question_results.append({
                "question_number": question_number,
                "mongo_id": question_id,
                "category": category,
                "selected_answer": selected_answer,
                "correct_answer": correct_answer,
                "result": result_status
            })

        # -----------------------------------------------------
        # 7. OVERALL SCORE
        # -----------------------------------------------------

        overall_score = (
            round(
                (correct_count / total_questions) * 100
            )
            if total_questions
            else 0
        )

        # Accuracy excludes skipped questions.
        accuracy = round(
            (
                correct_count
                / max(
                    correct_count + incorrect_count,
                    1
                )
            ) * 100
        )

        # -----------------------------------------------------
        # 8. CATEGORY SCORES
        # -----------------------------------------------------

        category_scores = {}

        for category in [
            "reasoning",
            "aptitude",
            "technical",
            "verbal"
        ]:

            total = category_totals[category]

            correct = category_correct[category]

            skipped = category_skipped[category]

            incorrect = (
                total
                - correct
                - skipped
            )

            if total > 0:

                category_scores[category] = {
                    "total": total,
                    "correct": correct,
                    "incorrect": incorrect,
                    "skipped": skipped,
                    "percentage": round(
                        (correct / total) * 100
                    )
                }

        # -----------------------------------------------------
        # 9. CREATE TASK 16 ROUND 2 RESULT
        # -----------------------------------------------------

        round2_result = {
            "total_questions": total_questions,

            "correct_answers": correct_count,

            "incorrect_answers": incorrect_count,

            "skipped_answers": skipped_count,

            "score": overall_score,

            "accuracy": accuracy,

            "category_scores": category_scores,

            "question_results": question_results
        }

        # -----------------------------------------------------
        # 10. SAVE TASK 16 RESULT
        #
        # IMPORTANT:
        # Save BOTH:
        #
        # test_score
        #     -> compatibility with existing backend
        #
        # round2_result
        #     -> complete Task 16 feedback data
        # -----------------------------------------------------

        await db["interviews"].update_one(
            {
                "_id": oid
            },
            {
                "$set": {

                    # User's submitted answers
                    "test_answers": safe_answers,

                    # Existing score field used by
                    # interview_controller.py
                    "test_score": overall_score,

                    # Complete Task 16 result
                    "round2_result": round2_result,

                    # Move to Round 3 setup
                    "stage": "setup"
                }
            }
        )

        # -----------------------------------------------------
        # 11. RESPONSE
        # -----------------------------------------------------

        return {
            "message": "Test submitted successfully",

            "round2_result": round2_result
        }