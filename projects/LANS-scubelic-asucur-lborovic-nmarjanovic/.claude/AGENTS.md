# LLM Answer Watcher - Subagent Team

This project uses **3 specialized role-based subagents** to help with development. Each represents a key role in the development lifecycle and activates automatically when working in their domain.

## The Development Team

### 1. **Developer** 👨‍💻 (`developer`)

**Role:** Senior Python Developer - Implements features according to SPECS.md

**Activates when:**
- Implementing new features from milestone plans
- Writing production code for any module
- Building the CLI, database, extraction logic, etc.
- Setting up LLM client integrations
- Creating utilities and helpers

**Expertise:**
- ✅ Python 3.12+ modern patterns
- ✅ Pydantic models with validation
- ✅ Rich library for beautiful CLI output
- ✅ Word-boundary regex for brand matching
- ✅ SQLite schema with versioning
- ✅ Dual-mode CLI (human/agent)
- ✅ Retry logic with tenacity
- ✅ Cost estimation
- ✅ UTC timestamps everywhere

**Example usage:**
```
"Implement the config loader according to milestone 1"
"Build the OpenAI client with retry logic"
"Create the mention detector with word-boundary regex"
```

**What developer does:**
- ✅ Writes production code
- ✅ Follows SPECS.md architecture
- ✅ Implements features from milestones
- ✅ Creates docstrings for all public APIs

**What developer doesn't do:**
- ❌ Write tests (that's tester's job)
- ❌ Review code (that's reviewer's job)

---

### 2. **Tester** 🧪 (`tester`)

**Role:** Senior Test Engineer - Ensures 80%+ coverage with comprehensive testing

**Activates when:**
- Writing tests for new features
- Creating fixtures for LLM responses
- Setting up HTTP mocks
- Checking coverage reports
- Testing edge cases

**Expertise:**
- 📊 80%+ coverage for core modules
- 💯 100% coverage for critical paths
- 🧪 pytest fixtures for common scenarios
- 🔀 HTTP mocking with pytest-httpx
- ⏰ Time mocking with freezegun
- 🎯 Edge case testing
- ✅ CLI behavior validation (JSON output, exit codes, ANSI codes)

**Example usage:**
```
"Write comprehensive tests for the mention detector"
"Create fixtures for different LLM response formats"
"Test the retry logic with mocked API failures"
"Validate CLI exit codes are correct"
```

**What tester does:**
- ✅ Writes all test code
- ✅ Creates fixtures and mocks
- ✅ Ensures coverage targets met
- ✅ Tests edge cases and error paths

**What tester doesn't do:**
- ❌ Write production code (that's developer's job)
- ❌ Review code (that's reviewer's job)

---

### 3. **Reviewer** 👁️ (`reviewer`)

**Role:** Senior Code Reviewer - Ensures production-ready quality and SPECS.md compliance

**Activates when:**
- Code is ready for review
- Before merging pull requests
- After implementing features
- Before marking milestones complete
- Someone asks "Does this look good?"

**Expertise:**
- 🔍 SPECS.md compliance validation
- 🔒 Security review (API keys, SQL injection, XSS)
- 📐 Code quality and maintainability
- ⚡ Performance implications
- 📚 Documentation completeness
- 🐛 Error handling review

**Example usage:**
```
"Review the config loader implementation"
"Check if this code matches SPECS.md requirements"
"Review for security issues before merging"
```

**Review checklist:**
- ✅ SPECS.md compliance
- ✅ Security (no API key leaks, SQL injection prevented, XSS blocked)
- ✅ Python 3.12+ patterns
- ✅ Error handling comprehensive
- ✅ Documentation complete
- ✅ Performance acceptable
- ✅ Edge cases handled

**What reviewer does:**
- ✅ Reviews code for quality
- ✅ Checks security issues
- ✅ Validates spec compliance
- ✅ Provides structured feedback (✅ Approved, ❌ Required Changes, ⚠️ Suggestions)

**What reviewer doesn't do:**
- ❌ Write code (that's developer's job)
- ❌ Write tests (that's tester's job)

---

## Development Workflow

### Typical Feature Implementation

```
1. Developer implements feature
   "Implement the mention detector with word-boundary regex"

2. Tester writes comprehensive tests
   "Write tests for the mention detector covering all edge cases"

3. Reviewer validates quality
   "Review the mention detector implementation for SPECS.md compliance"

4. Iterate if needed
   - Reviewer finds issues → Developer fixes
   - Coverage gaps → Tester adds tests
   - Repeat until approved
```

### Milestone Workflow

```
Milestone 1: Project skeleton & config

1. Developer: "Implement config/loader.py per milestone 1"
2. Tester: "Write tests for config validation edge cases"
3. Reviewer: "Review milestone 1 implementation"

✅ Milestone 1 complete when reviewer approves
```

## How to Use Subagents

### Automatic Activation

Subagents activate automatically based on context:

```
# Automatically activates developer
"I need to implement the database schema"

# Automatically activates tester
"Add tests for the cost estimation logic"

# Automatically activates reviewer
"Is this code ready to merge?"
```

### Explicit Activation

You can explicitly request a specific subagent:

```
"Use the developer to implement config loading"
"Have the tester create fixtures for LLM responses"
"Ask the reviewer to check for security issues"
```

### Chaining Subagents

For complete feature delivery, chain the team:

```
"Use the developer to implement the mention detector,
then have the tester write comprehensive tests,
then have the reviewer validate it matches SPECS.md"
```

## Subagent Tools

Each subagent has access to appropriate tools:

| Subagent | Tools Available | Why |
|----------|----------------|-----|
| **Developer** | Read, Write, Edit, Grep, Glob, Bash | Can implement and test code |
| **Tester** | Read, Write, Edit, Grep, Glob, Bash | Can write tests and run pytest |
| **Reviewer** | Read, Grep, Glob | Can review but not modify code |

## Review Feedback Format

When reviewer provides feedback, expect this structure:

### ✅ Approved
- What's well-implemented
- What follows best practices

### ❌ Required Changes
- **File:Line** - Issue description
- **Risk Level**: Critical / High / Medium / Low
- **Expected**: What SPECS.md requires
- **Fix**: Specific code change needed

### ⚠️ Suggestions
- Optional improvements
- Performance optimizations

### 💡 Consider
- Future enhancements
- Edge cases to test

## Best Practices

### 1. Use the Right Agent for the Job

```
# ✅ GOOD
"Developer: implement the feature"
"Tester: write the tests"
"Reviewer: check the code"

# ❌ BAD
"Developer: also write tests and review your own code"
```

### 2. Follow the Workflow

```
Implementation → Testing → Review → Merge
     ↓              ↓          ↓
 Developer      Tester    Reviewer
```

### 3. Iterate Based on Feedback

```
Reviewer finds issues → Developer fixes → Tester updates tests → Reviewer re-reviews
```

### 4. Trust Their Expertise

- **Developer** knows SPECS.md architecture
- **Tester** knows coverage requirements
- **Reviewer** knows production standards

## Quality Gates

Before code is production-ready, it must pass:

1. ✅ **Developer**: Feature implemented per SPECS.md
2. ✅ **Tester**: 80%+ coverage with edge cases
3. ✅ **Reviewer**: Security, quality, and compliance checks

## Example Session

```
User: "Let's implement milestone 1 - config loader"

Developer: "I'll implement config/loader.py with YAML loading,
            Pydantic validation, and env var resolution..."
            [writes code]

User: "Now add tests"

Tester: "I'll write tests covering:
         - Valid config loading
         - Missing env vars
         - Invalid YAML
         - Duplicate intent IDs
         [writes tests with fixtures]

User: "Review this before we commit"

Reviewer: "Reviewing...

✅ Approved:
- Modern Python 3.12+ type hints
- Pydantic validation with field validators
- Clear error messages

❌ Required Changes:
- File:45 - API key not validated for empty string
  Risk: Medium
  Fix: Add `if not api_key or api_key.isspace()` check

⚠️ Suggestions:
- Consider caching loaded config for performance

Overall: Approve with minor fix for API key validation"

User: "Developer, fix the API key validation issue"

Developer: "Fixed - added empty string check with clear error message"

User: "Reviewer, re-review"

Reviewer: "✅ APPROVED - Ready to merge"
```

## Adding Custom Subagents

To add your own subagent to the team:

1. Create `.claude/agents/your-agent.md`
2. Add YAML frontmatter:
   ```yaml
   ---
   name: your-agent
   description: Use PROACTIVELY when...
   tools: Read, Write, Edit
   model: sonnet
   ---
   ```
3. Write detailed system prompt
4. Commit to version control

## Check Available Subagents

View all configured subagents:
```
/agents
```

This shows the full team and their descriptions.

## Hooks Integration

The project uses **Claude Code hooks** to automatically enforce code quality:

### 🛡️ Protected Files Warning
Before editing SPECS.md or agent files, you'll see a warning:
```
⚠️  WARNING: Modifying protected file: SPECS.md
💡 This file is critical to the project. Make sure changes are intentional.
```

### 🔍 Automatic Ruff Linting
After editing Python files, ruff runs automatically:
```
🔍 Running ruff on llm_answer_watcher/config/loader.py...
✅ Ruff check passed
```

### 📝 Git Commit Reminders
When you finish work, you'll see uncommitted changes:
```
📝 Git Status: 5 file(s) modified
 M SPECS.md
 M .claude/AGENTS.md
...

💡 Conventional commit format:
   feat: add new feature
   fix: bug fix
   docs: documentation changes
```

### How Hooks Help the Team

| Subagent | Hook Benefit |
|----------|-------------|
| **Developer** | Instant feedback on Python code style violations |
| **Tester** | Linting catches issues before tests run |
| **Reviewer** | Reduced manual review burden for style issues |
| **All** | Consistent conventional commits for clear history |

See `.claude/HOOKS.md` for full documentation and `.claude/HOOKS_QUICKREF.md` for quick reference.

## Version Control

These subagents are **project-specific** and committed to version control. All team members work with the same AI development team.

## References

- **SPECS.md** - Full project specification
- [Claude Code Subagents Docs](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Nikola Balić - Agent-Friendly CLIs](https://nibzard.com/agent-experience)
- [Mario Zechner - CLI vs MCP](https://mariozechner.at/posts/2025-08-15-mcp-vs-cli/)

---

**Built for the LLM Answer Watcher project**

Production-ready CLI for monitoring brand mentions in LLM responses.
Developer 👨‍💻 + Tester 🧪 + Reviewer 👁️ = Quality Code ✨
