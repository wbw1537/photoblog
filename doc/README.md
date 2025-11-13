# Documentation Overview

This directory contains all project documentation for the PhotoBlog application.

## Quick Start

- **[requirements.md](requirements.md)** - Main requirements document (source of truth)
- **[feature-list.md](feature-list.md)** - Auto-generated release-focused view
- **[REQUIREMENTS_GUIDE.md](REQUIREMENTS_GUIDE.md)** - How to maintain requirements

## File Descriptions

| File | Purpose | Edit Manually? |
|------|---------|----------------|
| `requirements.md` | Detailed requirements organized by feature area | ✅ Yes - Source of truth |
| `feature-list.md` | Requirements organized by release version | ❌ No - Auto-generated |
| `REQUIREMENTS_GUIDE.md` | Best practices and workflow guide | ✅ Yes - Documentation |
| `requirements-styling-demo.md` | Examples of markdown styling options | 📖 Reference only |

## Common Tasks

### Adding a New Requirement

1. Open `requirements.md`
2. Find the appropriate feature section (or create new one)
3. Add a row to the table with new ID (e.g., PB-AUTH-08)
4. Regenerate feature-list:
   ```bash
   python scripts/sync_requirements.py requirements-to-features
   ```

### Updating Status

When you complete a requirement:
1. Change "❌ Not Implemented" to "✅ Implemented"
2. Update Release Status if needed (e.g., 📋 Backlog → 🎯 v0.2.0)
3. Regenerate feature-list

### Planning a Release

To see what's planned for v0.1.0:
- Check `feature-list.md` under the "## v0.1.0" section
- Or grep in requirements: `grep "🎯 v0.1.0" doc/requirements.md`

### Validating Consistency

```bash
python scripts/sync_requirements.py validate
```

## Status Icons Reference

**Priority**:
- 🔴 High - Core functionality
- 🟡 Medium - Important but not blocking
- 🟢 Low - Nice to have

**Implementation**:
- ✅ Implemented - Code complete
- ❌ Not Implemented - Not started
- 🚧 In Progress - Currently working on

**Release**:
- 🚀 v0.1.0 - Released in this version
- 🎯 v0.1.0 - Planned for this version
- 📋 Backlog - Planned but no version yet
- 🔮 Future - Long-term idea

## Feature Areas

Current feature areas with ID prefixes:

- **PB-AUTH** - User Authentication
- **PB-PROFILE** - User Profile Management
- **PB-SCAN** - Photo Scanning
- **PB-GALLERY** - Photo Viewing & Gallery
- **PB-SOCIAL** - Photo Social Features
- **PB-BLOG** - Blog Management
- **PB-TAG** - Tag Management
- **PB-NETWORK** - Federation & Networking

## Automation Scripts

Located in `scripts/sync_requirements.py`:

```bash
# Generate feature-list from requirements
python scripts/sync_requirements.py requirements-to-features

# Validate consistency
python scripts/sync_requirements.py validate
```

## Technical Documentation

Additional technical documentation is stored in `doc/tech/`:
- [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md)
- [Network-and-sharing.md](tech/Network-and-sharing.md)
- [Shared-user-definition.md](tech/Shared-user-definition.md)

---

**Need help?** Check the [REQUIREMENTS_GUIDE.md](REQUIREMENTS_GUIDE.md) for detailed workflows and best practices.
