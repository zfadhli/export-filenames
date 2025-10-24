#!/usr/bin/env bun

import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import cliProgress from "cli-progress";

interface FileStructure {
	[key: string]: string[] | FileStructure;
}

let progressBar: cliProgress.SingleBar;

function getTimestamp() {
	return new Date()
		.toISOString()
		.slice(0, 19)
		.replace(/-/g, "")
		.replace("T", "_")
		.replace(/:/g, "");
}

function countFiles(path: string): number {
	let count = 0;
	try {
		for (const item of readdirSync(path)) {
			const p = join(path, item);
			if (statSync(p).isDirectory()) {
				count += countFiles(p);
			} else {
				count++;
			}
		}
	} catch {}
	return count;
}

function hasSubfolders(path: string): boolean {
	const ignored = new Set(["node_modules", ".git", ".next", "dist", "build"]);
	return readdirSync(path).some((item) => {
		if (ignored.has(item)) return false;
		return statSync(join(path, item)).isDirectory();
	});
}

function scanFolder(path: string, relativePath: string): FileStructure {
	const result: FileStructure = {};

	for (const item of readdirSync(path)) {
		const p = join(path, item);
		const newRelativePath = relativePath ? `${relativePath}/${item}` : item;

		if (statSync(p).isDirectory()) {
			Object.assign(result, scanFolder(p, newRelativePath));
		}
	}

	const files = readdirSync(path).filter((f) => {
		progressBar.increment();
		return !statSync(join(path, f)).isDirectory();
	});

	if (files.length) {
		result[relativePath] = files;
	}

	return result;
}

function groupByParent(obj: FileStructure): FileStructure {
	const grouped: FileStructure = {};

	for (const [key, value] of Object.entries(obj)) {
		const segments = key.split("/");

		if (segments.length === 1) {
			grouped[key] = value;
		} else {
			const [parent = "", ...rest] = segments;
			const child = rest.join("/");

			if (!grouped[parent]) {
				grouped[parent] = {};
			}
			(grouped[parent] as FileStructure)[child] = value;
		}
	}

	return grouped;
}

function scan(path: string): FileStructure {
	const result: FileStructure = {};
	const rootFiles: string[] = [];

	for (const item of readdirSync(path)) {
		const p = join(path, item);
		const stat = statSync(p);

		if (stat.isDirectory()) {
			if (hasSubfolders(p)) {
				const folderContents = scanFolder(p, "");
				if (Object.keys(folderContents).length) {
					result[item] = groupByParent(folderContents);
				}
			} else {
				const files = readdirSync(p).filter((f) => {
					progressBar.increment();
					return !statSync(join(p, f)).isDirectory();
				});

				if (files.length) {
					result[item] = files;
				}
			}
		} else if (stat.isFile()) {
			rootFiles.push(item);
			progressBar.increment();
		}
	}

	if (rootFiles.length) {
		result.root = rootFiles;
	}

	return result;
}

async function main() {
	const targetPath = process.argv[2] || process.cwd();
	const folderName = basename(targetPath);

	// Verify path exists
	try {
		statSync(targetPath);
	} catch {
		console.error(`Error: Cannot access directory: ${targetPath}`);
		process.exit(1);
	}

	const total = countFiles(targetPath);

	if (total === 0) {
		console.error("Error: No files found in directory");
		process.exit(1);
	}

	progressBar = new cliProgress.SingleBar({
		format: "Progress |{bar}| {percentage}% ({value}/{total})",
		barCompleteChar: "\u2588",
		barIncompleteChar: "\u2591",
		hideCursor: true,
	});

	progressBar.start(total, 0);
	const data = scan(targetPath);
	progressBar.stop();

	const file = `${folderName}_${getTimestamp()}.json`;

	await Bun.write(file, JSON.stringify(data, null, 2));
	console.log(`✅ Saved to ${file}`);
}

main().catch((e) => {
	console.error("Error:", e);
	process.exit(1);
});
