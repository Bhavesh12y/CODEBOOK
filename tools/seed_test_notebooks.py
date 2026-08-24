import json
from pathlib import Path

notebooks_dir = Path("notebooks")
notebooks_dir.mkdir(exist_ok=True)

test_notebooks = {
    "c-testing": {
        "name": "C Testing",
        "language": "c",
        "cells": [
            ("markdown", "# C Testing Notebook\nInteractive I/O, structs, functions, and state persistence."),
            ("code", "#include <stdio.h>\n\nprintf(\"Hello from CodeBook C!\\n\");"),
            ("code", "int x = 42;\nint y = 58;\nprintf(\"x + y = %d\\n\", x + y);"),
            ("code", "int add(int a, int b) {\n    return a + b;\n}"),
            ("code", "printf(\"Result of add(15, 25): %d\\n\", add(15, 25));"),
            ("code", "char name[64];\nint age;\n\nprintf(\"Enter your name: \");\nscanf(\"%63s\", name);\n\nprintf(\"Enter your age: \");\nscanf(\"%d\", &age);\n\nprintf(\"Hello %s, you are %d years old!\\n\", name, age);")
        ]
    },
    "python-testing": {
        "name": "Python Testing",
        "language": "python",
        "cells": [
            ("markdown", "# Python Testing Notebook\nInteractive input, functions, imports, and persistent namespace."),
            ("code", "print(\"Hello from CodeBook Python!\")"),
            ("code", "x = 100\ny = 250\nprint(f\"x + y = {x + y}\")"),
            ("code", "def greet(name, times=3):\n    return f\"Welcome {name}! \" * times"),
            ("code", "print(greet(\"Developer\"))"),
            ("code", "import math\nprint(f\"pi = {math.pi:.4f}, sqrt(144) = {math.sqrt(144)}\")"),
            ("code", "name = input(\"Enter your name: \")\nage = int(input(\"Enter your age: \"))\n\nprint(f\"Hello {name}, you are {age} years old!\")")
        ]
    },
    "java-testing": {
        "name": "Java Testing",
        "language": "java",
        "cells": [
            ("markdown", "# Java Testing Notebook\nInteractive Scanner input, static methods, inner classes, and state replay."),
            ("code", "System.out.println(\"Hello from CodeBook Java!\");"),
            ("code", "int a = 15;\nint b = 35;\nSystem.out.println(\"Sum: \" + (a + b));"),
            ("code", "static int multiply(int x, int y) {\n    return x * y;\n}"),
            ("code", "System.out.println(\"multiply(6, 7) = \" + multiply(6, 7));"),
            ("code", "static class Book {\n    String title;\n    int pages;\n    Book(String t, int p) { title = t; pages = p; }\n}"),
            ("code", "Book book = new Book(\"CodeBook Guide\", 250);\nSystem.out.println(\"Created book: \" + book.title + \" with \" + book.pages + \" pages.\");"),
            ("code", "Scanner scanner = new Scanner(System.in);\nSystem.out.print(\"Enter your name: \");\nString name = scanner.nextLine();\nSystem.out.print(\"Enter your age: \");\nint age = scanner.nextInt();\n\nSystem.out.println(\"Hello \" + name + \", you are \" + age + \" years old!\");")
        ]
    },
    "cpp-testing": {
        "name": "C++ Testing",
        "language": "cpp",
        "cells": [
            ("markdown", "# C++ Testing Notebook\nInteractive std::cin input, STL vectors, and state replay."),
            ("code", "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\ncout << \"Hello from CodeBook C++!\" << endl;"),
            ("code", "vector<int> nums = {5, 2, 8, 1, 9};\nsort(nums.begin(), nums.end());\ncout << \"Sorted numbers: \";\nfor (int n : nums) cout << n << \" \";\ncout << endl;"),
            ("code", "string name;\nint age;\n\ncout << \"Enter your name: \";\ncin >> name;\n\ncout << \"Enter your age: \";\ncin >> age;\n\ncout << \"Hello \" << name << \", you are \" << age << \" years old!\" << endl;")
        ]
    }
}

for slug, data in test_notebooks.items():
    doc = {
        "version": 2,
        "id": slug,
        "metadata": {
            "name": data["name"],
            "description": f"Official {data['name']} test workspace with interactive I/O examples.",
            "language": data["language"],
            "createdAt": "2026-08-25T00:00:00.000Z",
            "updatedAt": "2026-08-25T00:00:00.000Z"
        },
        "cells": [
            {
                "id": f"{slug}-cell-{i+1}",
                "type": ctype,
                "source": src,
                "outputs": [],
                "executionCount": None,
                "status": "idle",
                "executionTime": None
            }
            for i, (ctype, src) in enumerate(data["cells"])
        ]
    }
    cbnb_path = notebooks_dir / f"{slug}.cbnb"
    cppnb_path = notebooks_dir / f"{slug}.cppnb"
    cbnb_path.write_text(json.dumps(doc, indent=2), encoding="utf-8")
    cppnb_path.write_text(json.dumps(doc, indent=2), encoding="utf-8")

print("Created all test notebooks.")
