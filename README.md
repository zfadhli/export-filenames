# export-filenames

Export folder structure and filenames to JSON with a nice progress bar.

## Features

- 📁 Recursively scan directories
- 📊 Real-time progress bar
- 🎯 Groups nested folders by parent
- 📄 Export to JSON format
- 🚀 Works in any directory

## Installation

```bash
npm install -g export-filenames
```

Or use with `npx`:

```bash
npx export-filenames
```

## Usage

Navigate to any directory and run:

```bash
export-filenames
```

This will scan the current directory and create a JSON file with the structure:

```bash
Downloads_20251024_122342.json
```

## Output Format

### Folder with nested directories:

```json
{
  "Videos": {
    "Learn CLI": {
      "Lesson 1": [
        "intro.mp4",
      ],
      "Lesson 2": [
        "main.mp4"
      ]
    }
  }
}
```

### Folder with only files:

```json
{
  "Documents": [
    "readme.md",
    "notes.txt"
  ]
}
```

### Root level files:

```json
{
  "root": [
    "package.json",
    "config.yaml"
  ],
  "Videos": [...]
}
```

## Filename Format

Output files are named: `{folder_name}_{YYYYMMDD}_{HHMMSS}.json`

Example: `Downloads_20251024_122342.json`

## Examples

**Export Downloads folder:**

```bash
cd ~/Downloads
export-filenames
```

**Export current directory:**

```bash
export-filenames
```

**Check the output:**

```bash
cat Downloads_20251024_122342.json
```

## Progress Bar

The tool displays a real-time progress bar while scanning:

```
Progress |████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| 45% (225/500)
```

## License

MIT