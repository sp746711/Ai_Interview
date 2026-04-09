import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.core.config import settings

async def seed_questions():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]

    # Clear existing questions
    await db["test_questions"].delete_many({})

    questions = [
        # Technical - Reasoning
        {
            "question": "What is the next number in the sequence: 2, 4, 8, 16, ...?",
            "options": ["24", "32", "18", "20"],
            "correct_answer": "32",
            "difficulty": "easy",
            "role": "technical"
        },
        {
            "question": "If all roses are flowers and some flowers fade quickly, which of the following is true?",
            "options": ["All roses fade quickly", "Some roses fade quickly", "No roses fade quickly", "Cannot be determined"],
            "correct_answer": "Cannot be determined",
            "difficulty": "easy",
            "role": "technical"
        },
        {
            "question": "A train travels 60 km in 1 hour. How long will it take to travel 180 km?",
            "options": ["2 hours", "3 hours", "1.5 hours", "4 hours"],
            "correct_answer": "3 hours",
            "difficulty": "easy",
            "role": "technical"
        },
        {
            "question": "What comes next: O, T, T, F, F, S, S, ...?",
            "options": ["E", "N", "T", "S"],
            "correct_answer": "E",
            "difficulty": "medium",
            "role": "technical"
        },
        {
            "question": "If 5 machines make 5 widgets in 5 minutes, how long does it take 100 machines to make 100 widgets?",
            "options": ["5 minutes", "10 minutes", "100 minutes", "25 minutes"],
            "correct_answer": "5 minutes",
            "difficulty": "medium",
            "role": "technical"
        },
        # Technical - Aptitude
        {
            "question": "What is 15% of 200?",
            "options": ["30", "25", "35", "20"],
            "correct_answer": "30",
            "difficulty": "easy",
            "role": "technical"
        },
        {
            "question": "If x + y = 10 and x - y = 2, what is x?",
            "options": ["6", "8", "4", "5"],
            "correct_answer": "6",
            "difficulty": "easy",
            "role": "technical"
        },
        {
            "question": "A rectangle has length 8 and width 5. What is its area?",
            "options": ["40", "26", "13", "56"],
            "correct_answer": "40",
            "difficulty": "easy",
            "role": "technical"
        },
        {
            "question": "Solve: 2x + 3 = 11",
            "options": ["x = 4", "x = 3", "x = 5", "x = 2"],
            "correct_answer": "x = 4",
            "difficulty": "medium",
            "role": "technical"
        },
        {
            "question": "What is the square root of 144?",
            "options": ["12", "14", "10", "16"],
            "correct_answer": "12",
            "difficulty": "medium",
            "role": "technical"
        },
        # Technical - Basic Coding
        {
            "question": "What does 'print' do in Python?",
            "options": ["Reads input", "Displays output", "Defines a function", "Imports a module"],
            "correct_answer": "Displays output",
            "difficulty": "easy",
            "role": "technical"
        },
        {
            "question": "Which of these is a valid Python variable name?",
            "options": ["2variable", "variable-name", "variable_name", "_variable"],
            "correct_answer": "_variable",
            "difficulty": "easy",
            "role": "technical"
        },
        {
            "question": "What is the output of: print(2 + 3 * 4)",
            "options": ["20", "14", "24", "18"],
            "correct_answer": "14",
            "difficulty": "easy",
            "role": "technical"
        },
        {
            "question": "Which data type is mutable in Python?",
            "options": ["tuple", "string", "list", "int"],
            "correct_answer": "list",
            "difficulty": "medium",
            "role": "technical"
        },
        {
            "question": "What does 'len()' function return?",
            "options": ["Length of object", "Type of object", "Value of object", "Index of object"],
            "correct_answer": "Length of object",
            "difficulty": "medium",
            "role": "technical"
        },
        # Non-Technical - Reasoning
        {
            "question": "Which word does not belong: Apple, Banana, Carrot, Orange",
            "options": ["Apple", "Banana", "Carrot", "Orange"],
            "correct_answer": "Carrot",
            "difficulty": "easy",
            "role": "non_technical"
        },
        {
            "question": "If Monday is the first day, what is the 7th day?",
            "options": ["Sunday", "Monday", "Saturday", "Tuesday"],
            "correct_answer": "Sunday",
            "difficulty": "easy",
            "role": "non_technical"
        },
        {
            "question": "Complete the analogy: Book is to Library as Painting is to ___",
            "options": ["Museum", "Gallery", "Frame", "Artist"],
            "correct_answer": "Museum",
            "difficulty": "easy",
            "role": "non_technical"
        },
        {
            "question": "What comes next: January, March, May, ...?",
            "options": ["June", "July", "August", "September"],
            "correct_answer": "July",
            "difficulty": "medium",
            "role": "non_technical"
        },
        {
            "question": "If all cats are mammals and some mammals are pets, which is true?",
            "options": ["All cats are pets", "Some cats are pets", "No cats are pets", "Cannot determine"],
            "correct_answer": "Cannot determine",
            "difficulty": "medium",
            "role": "non_technical"
        },
        # Non-Technical - Aptitude
        {
            "question": "What is 25% of 80?",
            "options": ["20", "25", "30", "15"],
            "correct_answer": "20",
            "difficulty": "easy",
            "role": "non_technical"
        },
        {
            "question": "If 3 apples cost $1.50, how much do 9 apples cost?",
            "options": ["$4.50", "$3.00", "$6.00", "$2.25"],
            "correct_answer": "$4.50",
            "difficulty": "easy",
            "role": "non_technical"
        },
        {
            "question": "What is 10 + 15 - 5?",
            "options": ["20", "30", "15", "25"],
            "correct_answer": "20",
            "difficulty": "easy",
            "role": "non_technical"
        },
        {
            "question": "If x = 5, what is 2x + 3?",
            "options": ["13", "10", "8", "15"],
            "correct_answer": "13",
            "difficulty": "medium",
            "role": "non_technical"
        },
        {
            "question": "What is 50% of 120?",
            "options": ["60", "70", "50", "80"],
            "correct_answer": "60",
            "difficulty": "medium",
            "role": "non_technical"
        }
    ]

    await db["test_questions"].insert_many(questions)
    print(f"Seeded {len(questions)} questions")

if __name__ == "__main__":
    asyncio.run(seed_questions())