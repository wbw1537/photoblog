#!/usr/bin/env python3
"""
Requirements Documentation Sync Tool

This script synchronizes between:
- requirements.md (detailed, organized by feature area)
- feature-list.md (release-focused, organized by version)

Usage:
    python sync_requirements.py requirements-to-features  # Generate feature-list from requirements
    python sync_requirements.py features-to-requirements  # Update requirements from feature-list
    python sync_requirements.py validate                 # Check consistency between both files
"""

import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from dataclasses import dataclass
from collections import defaultdict


@dataclass
class Requirement:
    """Represents a single requirement."""
    id: str
    feature_area: str
    description: str
    priority: str
    implementation_status: str  # Implemented, Not Implemented, In Progress
    release_status: str  # Released, Planned, Backlog, Future
    target_version: str  # v0.1.0, v0.2.0, etc.
    tech_docs: str


class RequirementsParser:
    """Parse requirements.md file."""

    EMOJI_MAP = {
        '🔴': 'High',
        '🟡': 'Medium',
        '🟢': 'Low',
        '✅': 'Implemented',
        '❌': 'Not Implemented',
        '🚧': 'In Progress',
        '🚀': 'Released',
        '🎯': 'Planned',
        '📋': 'Backlog',
        '🔮': 'Future'
    }

    REVERSE_EMOJI_MAP = {v: k for k, v in EMOJI_MAP.items()}

    def parse_requirements_file(self, file_path: Path) -> Dict[str, List[Requirement]]:
        """Parse requirements.md and return organized by feature area."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        features = {}
        current_feature = None

        # Pattern to match feature headers: ## Feature: NAME (PB-AREA)
        feature_pattern = r'## Feature: (.+?) \(PB-(\w+)\)'
        # Pattern to extract target version from feature header
        version_pattern = r'\*\*Target Release\*\*: (v[\d.]+)'

        lines = content.split('\n')
        i = 0

        while i < len(lines):
            line = lines[i]

            # Check if this is a feature header
            feature_match = re.search(feature_pattern, line)
            if feature_match:
                feature_name = feature_match.group(1)
                feature_area = feature_match.group(2)

                # Look ahead to find target version
                target_version = 'Backlog'
                for j in range(i, min(i + 5, len(lines))):
                    version_match = re.search(version_pattern, lines[j])
                    if version_match:
                        target_version = version_match.group(1)
                        break

                current_feature = {
                    'name': feature_name,
                    'area': feature_area,
                    'target_version': target_version,
                    'requirements': []
                }
                features[feature_area] = current_feature

            # Check if this is a table row with requirement data
            elif current_feature and line.startswith('| PB-'):
                req = self._parse_requirement_row(line, current_feature)
                if req:
                    current_feature['requirements'].append(req)

            i += 1

        return features

    def _parse_requirement_row(self, row: str, feature_context: dict) -> Requirement:
        """Parse a single table row into a Requirement object."""
        # Split by | and clean up
        cells = [cell.strip() for cell in row.split('|')[1:-1]]  # Remove empty first/last

        if len(cells) < 6:
            return None

        req_id, description, priority, impl_status, release_status, tech_docs = cells[:6]

        # Clean up emojis and extract text
        priority_clean = self._extract_text_from_emoji(priority)
        impl_clean = self._extract_status_from_badge_or_emoji(impl_status)
        release_clean = self._extract_text_from_emoji(release_status)

        return Requirement(
            id=req_id,
            feature_area=feature_context['area'],
            description=description,
            priority=priority_clean,
            implementation_status=impl_clean,
            release_status=release_clean,
            target_version=feature_context['target_version'],
            tech_docs=tech_docs if tech_docs != 'N/A' else ''
        )

    def _extract_text_from_emoji(self, text: str) -> str:
        """Extract clean text from emoji-prefixed strings."""
        for emoji, value in self.EMOJI_MAP.items():
            text = text.replace(emoji, '').strip()
        return text

    def _extract_status_from_badge_or_emoji(self, text: str) -> str:
        """Extract status from badge markdown or emoji."""
        # Check for badge pattern (check more specific patterns first!)
        if 'Not_Implemented' in text or 'Not Implemented' in text:
            return 'Not Implemented'
        elif 'In_Progress' in text or 'In Progress' in text:
            return 'In Progress'
        elif 'Implemented' in text:
            return 'Implemented'

        # Fallback to emoji extraction
        return self._extract_text_from_emoji(text)


class FeatureListGenerator:
    """Generate feature-list.md from requirements data."""

    def generate_feature_list(self, features: Dict[str, List[Requirement]], output_path: Path):
        """Generate feature-list.md organized by version."""
        # Group requirements by version
        versions = defaultdict(lambda: defaultdict(list))

        for feature_area, feature_data in features.items():
            for req in feature_data['requirements']:
                version = req.target_version
                feature_name = feature_data['name']
                versions[version][feature_name].append(req)

        # Sort versions
        sorted_versions = sorted(versions.keys(), key=self._version_sort_key)

        # Generate markdown
        output = ["# Feature List\n"]

        for version in sorted_versions:
            output.append(f"## {version}\n")

            for feature_name, requirements in sorted(versions[version].items()):
                output.append(f"### {feature_name}\n")

                for req in requirements:
                    status_emoji = "✅" if req.implementation_status == "Implemented" else "❌"
                    output.append(f"- {status_emoji} **{req.id}**: {req.description}")
                    if req.tech_docs:
                        output.append(f"  - 📚 Tech Doc: {req.tech_docs}")

                output.append("")  # Blank line between features

            output.append("")  # Blank line between versions

        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(output))

    def _version_sort_key(self, version: str) -> tuple:
        """Convert version string to sortable tuple."""
        if version == 'Backlog':
            return (999, 999, 999)

        # Extract numbers from v0.1.0 format
        match = re.search(r'v?(\d+)\.(\d+)\.(\d+)', version)
        if match:
            return tuple(int(x) for x in match.groups())
        return (0, 0, 0)


class RequirementsValidator:
    """Validate consistency between requirements.md and feature-list.md."""

    def validate(self, req_file: Path, feature_file: Path) -> List[str]:
        """Check for inconsistencies and return list of issues."""
        issues = []

        # Parse both files
        parser = RequirementsParser()
        features = parser.parse_requirements_file(req_file)

        # Collect all requirement IDs
        req_ids_in_requirements = set()
        for feature_data in features.values():
            for req in feature_data['requirements']:
                req_ids_in_requirements.add(req.id)

        # Parse feature list and look for IDs
        with open(feature_file, 'r', encoding='utf-8') as f:
            feature_content = f.read()

        req_ids_in_features = set(re.findall(r'PB-\w+-\d+', feature_content))

        # Check for missing IDs
        missing_in_features = req_ids_in_requirements - req_ids_in_features
        missing_in_requirements = req_ids_in_features - req_ids_in_requirements

        if missing_in_features:
            issues.append(f"⚠️  IDs in requirements.md but not in feature-list.md: {missing_in_features}")

        if missing_in_requirements:
            issues.append(f"⚠️  IDs in feature-list.md but not in requirements.md: {missing_in_requirements}")

        # Check for duplicate IDs
        all_ids = []
        for feature_data in features.values():
            all_ids.extend([req.id for req in feature_data['requirements']])

        duplicates = [id for id in set(all_ids) if all_ids.count(id) > 1]
        if duplicates:
            issues.append(f"⚠️  Duplicate requirement IDs found: {duplicates}")

        return issues


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    # File paths
    doc_dir = Path(__file__).parent.parent / 'doc'
    req_file = doc_dir / 'requirements.md'
    feature_file = doc_dir / 'feature-list.md'

    parser = RequirementsParser()
    generator = FeatureListGenerator()
    validator = RequirementsValidator()

    if command == 'requirements-to-features':
        print("📋 Parsing requirements.md...")
        features = parser.parse_requirements_file(req_file)

        print(f"✅ Found {len(features)} feature areas")
        print("📝 Generating feature-list.md...")

        generator.generate_feature_list(features, feature_file)
        print(f"✅ Generated {feature_file}")

    elif command == 'validate':
        print("🔍 Validating consistency between files...")
        issues = validator.validate(req_file, feature_file)

        if not issues:
            print("✅ No issues found! Files are consistent.")
        else:
            print(f"⚠️  Found {len(issues)} issue(s):\n")
            for issue in issues:
                print(f"  {issue}")
            sys.exit(1)

    elif command == 'features-to-requirements':
        print("⚠️  This direction is not yet implemented.")
        print("💡 Recommendation: Use requirements.md as the source of truth")
        print("   and generate feature-list.md from it.")

    else:
        print(f"❌ Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
