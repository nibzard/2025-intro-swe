# Hooks Quick Reference

## Active Hooks

| Hook | Trigger | Action |
|------|---------|--------|
| 🛡️ **Protected Files** | `PreToolUse` on Edit/Write | Warns before modifying SPECS.md or agent files |
| 🔍 **Ruff Linting** | `PostToolUse` on Edit/Write | Auto-lints Python files after editing |
| 📝 **Git Reminder** | `Stop` after any tool | Shows uncommitted changes + commit format |
| 📋 **TODO Tracker** | `SessionStart` | Shows TODO.md progress + next tasks |
| ✅ **Subagent Reminder** | `SubagentStop` | Reminds to update TODO.md after work |

## Conventional Commit Types

```bash
feat:     Add new feature
fix:      Bug fix
docs:     Documentation only
refactor: Code refactoring (no behavior change)
test:     Add or update tests
chore:    Maintenance (dependencies, config)
style:    Code style (formatting)
perf:     Performance improvements
ci:       CI/CD configuration
```

## Common Commands

```bash
# View hooks configuration
cat .claude/hooks.json | jq

# Run ruff manually
ruff check . --fix

# Format all code
ruff format .

# Check git status
git status

# Stage changes interactively
git add -p

# Commit with conventional format
git commit -m "feat: implement feature X"
```

## File Locations

- **Hooks config**: `.claude/hooks.json`
- **Hooks docs**: `.claude/HOOKS.md`
- **Ruff config**: `ruff.toml`
- **Subagents**: `.claude/agents/*.md`

## Troubleshooting

**Ruff not found**: `pip install ruff`
**Hook not running**: Check `.claude/hooks.json` syntax with `jq`
**Git reminder not showing**: Ensure you're in a git repository

See `.claude/HOOKS.md` for full documentation.
