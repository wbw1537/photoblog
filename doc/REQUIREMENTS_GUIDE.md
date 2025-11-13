# Requirements Documentation Guide

This guide explains how to manage and maintain the project's requirements documentation.

## File Structure

```
doc/
├── requirements.md        # Source of truth - detailed requirements by feature
├── feature-list.md        # Generated - release-focused view by version
└── REQUIREMENTS_GUIDE.md  # This file
```

## Design Principles

### 1. Single Source of Truth
- **requirements.md** is the primary source
- **feature-list.md** is generated from requirements.md
- Never edit feature-list.md manually

### 2. Hierarchical Organization
Requirements are organized by **feature areas** rather than sequential IDs:

```
Feature: User Authentication (PB-AUTH)
├── PB-AUTH-01: Backend - Register API
├── PB-AUTH-02: UI - Register Form
└── PB-AUTH-03: Backend - Login API
```

**Benefits**:
- Related requirements grouped together
- Easy to add enhancements to existing features
- Clear feature boundaries

### 3. Dual Status Tracking

Each requirement has TWO status fields:

1. **Implementation Status**: Is the code written?
   - ✅ Implemented
   - ❌ Not Implemented
   - 🚧 In Progress

2. **Release Status**: When will it ship?
   - 🚀 v0.1.0 (Released)
   - 🎯 v0.1.0 (Planned for release)
   - 📋 Backlog
   - 🔮 Future

**Example**: Backend API might be "Implemented" but "Planned for v0.1.0" (not released yet)

## ID Naming Convention

### Format: `PB-{AREA}-{NUMBER}`

- **PB**: PhotoBlog (project prefix)
- **AREA**: Feature area code (uppercase, 3-8 chars)
- **NUMBER**: Two-digit sequence (01, 02, 03...)

### Feature Areas

| Code | Feature Area | Example |
|------|--------------|---------|
| AUTH | User Authentication | PB-AUTH-01 |
| PROFILE | User Profile Management | PB-PROFILE-01 |
| SCAN | Photo Scanning | PB-SCAN-01 |
| GALLERY | Photo Gallery & Viewing | PB-GALLERY-01 |
| SOCIAL | Social Features (likes, etc) | PB-SOCIAL-01 |
| BLOG | Blog Management | PB-BLOG-01 |
| TAG | Tag Management | PB-TAG-01 |
| NETWORK | Federation & Networking | PB-NETWORK-01 |

### Adding New Feature Areas

When adding a new feature area:
1. Choose a clear, short code (e.g., SHARE, EXPORT, ADMIN)
2. Add it to the table above
3. Create a new feature section in requirements.md

## Workflow

### Adding a New Requirement

1. **Identify the feature area**
   - Does it fit an existing feature? Use that area code
   - Need a new feature? Create a new section

2. **Create the requirement entry**
   ```markdown
   | PB-AUTH-08 | Backend - Password reset via email | 🔴 High | ❌ Not Implemented | 📋 Backlog | N/A |
   ```

3. **Regenerate feature-list.md**
   ```bash
   python scripts/sync_requirements.py requirements-to-features
   ```

### Updating Status

When you implement a feature:
1. Change Implementation from ❌ to ✅
2. Update Release Status (e.g., 📋 Backlog → 🎯 v0.2.0)
3. Regenerate feature-list.md

### Planning a Release

To see what's planned for v0.1.0:
```bash
grep "v0.1.0" doc/requirements.md
```

Or check the generated feature-list.md which groups by version.

### Validating Consistency

Check for issues between files:
```bash
python scripts/sync_requirements.py validate
```

This checks for:
- Missing IDs
- Duplicate IDs
- Inconsistencies between files

## Best Practices

### ✅ DO

- Keep requirements.md as the source of truth
- Use descriptive requirement descriptions
- Link to tech docs when available
- Update both status fields independently
- Run validation regularly

### ❌ DON'T

- Don't manually edit feature-list.md
- Don't use sequential IDs across all features (PB-1, PB-2...)
- Don't mix different feature areas in one table
- Don't forget to regenerate feature-list.md after changes

## Quick Reference

### Status Emojis

**Priority**:
- 🔴 High - Core functionality, blocking issues
- 🟡 Medium - Important but not blocking
- 🟢 Low - Nice to have, polish

**Implementation**:
- ✅ Implemented - Code written and working
- ❌ Not Implemented - Not started yet
- 🚧 In Progress - Currently being worked on

**Release**:
- 🚀 Released - Shipped in a version
- 🎯 Planned - Scheduled for specific version
- 📋 Backlog - Planned but no version assigned
- 🔮 Future - Long-term ideas

### Common Commands

```bash
# Generate feature-list from requirements
python scripts/sync_requirements.py requirements-to-features

# Validate consistency
python scripts/sync_requirements.py validate

# Search for specific feature area
grep "PB-AUTH" doc/requirements.md

# See all not-implemented items
grep "Not Implemented" doc/requirements.md

# See all items planned for v0.1.0
grep "v0.1.0" doc/requirements.md
```

## Migration from Old Format

If you're migrating from the old sequential ID format (PB-1, PB-2...):

1. Create feature groupings based on functionality
2. Rename IDs to new format (PB-AUTH-01, PB-GALLERY-01, etc.)
3. Update any references in code/docs
4. Run validation to ensure consistency

The Python script can help automate parts of this process.

## FAQ

**Q: Can I have requirements in multiple versions?**
A: Yes! A requirement's target version can change. Start in Backlog, move to v0.2.0 when planned.

**Q: What if a requirement spans multiple features?**
A: Choose the primary feature area. Add a note in the description linking to related areas.

**Q: Should UI and Backend be separate requirements?**
A: Yes! They often have different implementation timelines. Backend might be done but UI pending.

**Q: How do I mark something as released?**
A: Change Release Status from 🎯 v0.1.0 to 🚀 v0.1.0 when you ship the version.

**Q: Can I add custom fields?**
A: Yes, but update the Python script to parse them. Keep the core fields (ID, Description, Priority, Implementation, Release, Tech Docs).

## Examples

### Good Requirement Structure

```markdown
## Feature: Photo Export (PB-EXPORT)
**Overall Status**: 📋 Planned | **Target Release**: v0.2.0

Export photos in various formats.

| ID | Requirement | Priority | Implementation | Release Status | Tech Docs |
|:---|:------------|:---------|:---------------|:---------------|:----------|
| PB-EXPORT-01 | Backend - Export single photo as ZIP | 🔴 High | ❌ Not Implemented | 🎯 v0.2.0 | N/A |
| PB-EXPORT-02 | Backend - Export album as ZIP | 🔴 High | ❌ Not Implemented | 🎯 v0.2.0 | N/A |
| PB-EXPORT-03 | UI - Export button on photo detail | 🟡 Medium | ❌ Not Implemented | 🎯 v0.2.0 | N/A |
```

### Bad Requirement Structure

```markdown
# Requirements

| ID | Requirement | Status |
| PB-1 | User stuff | Done |
| PB-2 | Photo thing | Not done |
| PB-47 | Export feature | Todo |
```

Problems:
- No feature grouping
- Vague descriptions
- Single status field (ambiguous)
- No release planning
- IDs scattered across unrelated features

---

**Need help?** Check the examples in `requirements-v2-proposal.md` or run the validation script.
