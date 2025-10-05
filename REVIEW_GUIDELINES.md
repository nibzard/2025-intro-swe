# Peer Review Guidelines

This document provides templates and guidelines for conducting effective peer reviews.

## Review Comment Templates

### Positive Feedback Examples
```markdown
✅ **Great work!** Your code is well-structured and easy to read.

👍 **Excellent implementation** of the Student class. The greet() method is clear and concise.

🎉 **Good job** including the `if __name__ == "__main__":` block for testing.
```

### Constructive Improvement Suggestions
```markdown
🔧 **Suggestion**: Consider adding type hints to improve code clarity:
```python
def __init__(self, name: str, year: str) -> None:
```

📝 **Documentation**: Add a docstring to explain what the Student class does:
```python
class Student:
    """A simple class representing a student with basic information."""
```

🧪 **Testing**: You might want to add more test cases to verify edge cases.
```

### Questions for Clarification
```markdown
❓ **Question**: I noticed you used strings for year. Have you considered using integers instead?

❓ **Clarification needed**: Could you explain the reasoning behind this approach?

❓ **Edge case**: How would this handle an empty name or year?
```

## Review Process

### Step 1: Initial Setup
1. **Clone the PR branch locally**:
   ```bash
   git fetch origin pull/PR_NUMBER/head:pr-branch
   git checkout pr-branch
   ```

2. **Run the code** to verify it works:
   ```bash
   python students/USERNAME/lab1/intro.py
   ```

### Step 2: Code Review
- Check for syntax errors and runtime issues
- Verify code follows Python style guidelines (PEP 8)
- Ensure all required features are implemented
- Look for potential improvements or edge cases

### Step 3: Documentation Review
- Check if comments are clear and helpful
- Verify variable names are descriptive
- Ensure the code is self-documenting where possible

### Step 4: Leave Feedback
Use GitHub's review features to:
- Leave line-specific comments
- Provide an overall review summary
- Request changes if needed
- Approve when ready

## Review Rating System

### Overall Assessment
Choose one of the following:
- **🟢 Approve** - Code is ready to merge
- **🟡 Approve with suggestions** - Good work, minor improvements recommended
- **🔴 Request changes** - Significant issues need to be addressed

### Detailed Feedback Areas
- **Functionality**: Does the code work as expected?
- **Style**: Is the code readable and well-formatted?
- **Completeness**: Are all requirements met?
- **Best Practices**: Does the code follow Python conventions?

## Common Review Points

### For Lab 1 (Student Class)
Check for:
- [ ] Proper class structure with `__init__` method
- [ ] Working `greet()` method
- [ ] Correct parameter handling (name, year)
- [ ] Example usage in `if __name__ == "__main__":` block
- [ ] Clear variable names
- [ ] Appropriate comments or docstrings

### General Code Quality
- [ ] No syntax errors or runtime issues
- [ ] Consistent indentation (4 spaces)
- [ ] Descriptive variable and function names
- [ ] Proper error handling (if applicable)
- [ ] Code organization and structure

## Giving Good Feedback

### Do:
- Be specific and constructive
- Explain *why* a change is needed
- Provide examples or suggestions
- Acknowledge good work
- Focus on learning, not criticism

### Don't:
- Be vague or overly critical
- Rewrite the code for them
- Focus on minor formatting issues
- Use harsh or discouraging language
- Make assumptions about their knowledge level

## Template for Complete Review

```markdown
## Code Review Summary

**Overall Assessment**: 🟢🟡🔴 (Choose one)

### ✅ What Works Well
- [List specific strengths]

### 🔧 Suggested Improvements
- [List specific improvements with examples]

### ❓ Questions or Clarifications
- [Any questions about the implementation]

### 🧪 Testing Results
- Code runs successfully: Yes/No
- All features work as expected: Yes/No
- Tested edge cases: [Explain what you tested]

### 📚 Learning Focus
For future assignments, consider:
- [Learning recommendations based on this code]

**Review Complete** ✅
```

## Time Commitment

Peer reviews should take approximately 30-45 minutes per submission. This ensures thorough feedback while respecting everyone's time.