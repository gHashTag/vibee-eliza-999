#!/bin/bash

# Script to check all internal markdown links
BASE_DIR="/Users/playra/bible_vibecoder/Agentic Vibecoding"
REPORT_FILE="/tmp/broken_links_report.md"

echo "# Broken Links Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Find all markdown files and check internal links
find "$BASE_DIR" -name "*.md" -type f | while read -r file; do
    # Get relative path for reporting
    rel_file="${file#$BASE_DIR/}"

    # Extract markdown links: [text](path)
    grep -n '\[.*\]([^h][^t][^t][^p][^:][^/][^/].*\.md[^)]*' "$file" 2>/dev/null | while IFS=: read -r line_num match; do
        # Extract the link path from the match
        link=$(echo "$match" | grep -o '([^)]*.md[^)]*)' | sed 's/[()]//g' | sed 's/#.*//')

        if [ -n "$link" ]; then
            # Resolve the path relative to the file's directory
            file_dir=$(dirname "$file")

            # Handle different link formats
            if [[ "$link" == ../* ]]; then
                target_path="$file_dir/$link"
            elif [[ "$link" == ./* ]]; then
                target_path="$file_dir/${link#./}"
            elif [[ "$link" == /* ]]; then
                target_path="$BASE_DIR$link"
            else
                target_path="$file_dir/$link"
            fi

            # Normalize the path
            target_path=$(echo "$target_path" | sed 's/\/\.\//\//g')

            # URL decode common characters
            decoded_path=$(echo "$target_path" | sed 's/%20/ /g' | sed 's/%C2%A0/ /g')

            # Check if target exists
            if [ ! -f "$decoded_path" ] && [ ! -f "$target_path" ]; then
                echo "**Broken Link:**" >> "$REPORT_FILE"
                echo "- File: \`$rel_file\`" >> "$REPORT_FILE"
                echo "- Line: $line_num" >> "$REPORT_FILE"
                echo "- Link: \`$link\`" >> "$REPORT_FILE"
                echo "- Resolved: \`$decoded_path\`" >> "$REPORT_FILE"
                echo "" >> "$REPORT_FILE"
            fi
        fi
    done

    # Also check wiki-style links: [[link]]
    grep -n '\[\[.*\]\]' "$file" 2>/dev/null | while IFS=: read -r line_num match; do
        link=$(echo "$match" | grep -o '\[\[.*\]\]' | sed 's/\[\[//g' | sed 's/\]\]//g' | sed 's/|.*//')

        if [ -n "$link" ]; then
            # Try to find the file in the entire directory structure
            found=0
            while IFS= read -r potential_file; do
                found=1
                break
            done < <(find "$BASE_DIR" -name "${link}.md" -o -name "${link}" 2>/dev/null)

            if [ $found -eq 0 ]; then
                echo "**Broken Wiki Link:**" >> "$REPORT_FILE"
                echo "- File: \`$rel_file\`" >> "$REPORT_FILE"
                echo "- Line: $line_num" >> "$REPORT_FILE"
                echo "- Link: \`[[$link]]\`" >> "$REPORT_FILE"
                echo "" >> "$REPORT_FILE"
            fi
        fi
    done
done

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Total broken links found: $(grep -c "Broken Link:" "$REPORT_FILE" 2>/dev/null || echo 0)" >> "$REPORT_FILE"

cat "$REPORT_FILE"
