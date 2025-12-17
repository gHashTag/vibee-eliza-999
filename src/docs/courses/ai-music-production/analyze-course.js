#!/usr/bin/env node

/**
 * AI Music Production Course Analytics Script
 *
 * Analyzes all course markdown files and generates comprehensive metrics:
 * - Lines, words, reading time per file
 * - Code examples, images, exercises count
 * - Complexity scores
 * - Module and total statistics
 * - Content balance analysis
 */

const fs = require("fs");
const path = require("path");

// Configuration
const WORDS_PER_MINUTE = 200;
const COURSE_DIR = __dirname;
const TECHNICAL_TERMS = [
  "ai",
  "нейросеть",
  "модель",
  "промпт",
  "api",
  "token",
  "генерация",
  "обучение",
  "inference",
  "параметр",
  "алгоритм",
  "dataset",
  "rendering",
  "лицензия",
  "copyright",
  "дистрибуция",
  "монетизация",
  "workflow",
  "suno",
  "runway",
  "heygen",
  "elevenlabs",
  "openai",
  "stable diffusion",
  "lipsync",
  "морфинг",
  "upscale",
  "img2img",
  "text2video",
  "инпейнтинг",
];

/**
 * Get all markdown files recursively
 */
function getAllMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllMarkdownFiles(filePath, fileList);
    } else if (file.endsWith(".md")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Analyze single markdown file
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const lineCount = lines.length;

  // Word count (including Cyrillic)
  const wordCount =
    content
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .match(/[\wа-яА-ЯёЁ]+/g)?.length || 0;

  // Reading time
  const readingTime = Math.ceil(wordCount / WORDS_PER_MINUTE);

  // Code examples
  const codeBlockCount = (content.match(/```/g)?.length || 0) / 2;
  const inlineCodeCount =
    (content.match(/`[^`]+`/g)?.length || 0) - codeBlockCount * 2;

  // Images/screenshots
  const imageCount = content.match(/!\[.*?\]\(.*?\)/g)?.length || 0;

  // Practical exercises (tasks, assignments)
  const exercisePatterns = [
    /##\s*Задание/gi,
    /##\s*Практика/gi,
    /##\s*Упражнение/gi,
    /##\s*Домашнее задание/gi,
    /##\s*Task/gi,
    /##\s*Exercise/gi,
    /📝\s*Задание/gi,
    /✏️\s*Практика/gi,
    /🎯\s*Задача/gi,
  ];

  let exerciseCount = 0;
  exercisePatterns.forEach((pattern) => {
    exerciseCount += content.match(pattern)?.length || 0;
  });

  // Complexity score (technical terms density)
  const lowerContent = content.toLowerCase();
  let technicalTermCount = 0;
  TECHNICAL_TERMS.forEach((term) => {
    const regex = new RegExp(`\\b${term}`, "gi");
    technicalTermCount += lowerContent.match(regex)?.length || 0;
  });

  const complexityScore =
    wordCount > 0 ? Math.round((technicalTermCount / wordCount) * 100) : 0;

  // Headings structure
  const h1Count = content.match(/^#\s/gm)?.length || 0;
  const h2Count = content.match(/^##\s/gm)?.length || 0;
  const h3Count = content.match(/^###\s/gm)?.length || 0;

  // Links (external resources)
  const linkCount = content.match(/\[.*?\]\(http.*?\)/g)?.length || 0;

  // Emojis (engagement indicator)
  const emojiCount = content.match(/[\u{1F300}-\u{1F9FF}]/gu)?.length || 0;

  return {
    path: filePath.replace(COURSE_DIR, ""),
    lines: lineCount,
    words: wordCount,
    readingTime,
    codeBlocks: codeBlockCount,
    inlineCode: inlineCodeCount,
    images: imageCount,
    exercises: exerciseCount,
    technicalTerms: technicalTermCount,
    complexityScore,
    headings: { h1: h1Count, h2: h2Count, h3: h3Count },
    links: linkCount,
    emojis: emojiCount,
  };
}

/**
 * Group files by module
 */
function groupByModule(analyses) {
  const modules = {};

  analyses.forEach((analysis) => {
    // Extract module from path
    const pathParts = analysis.path.split("/").filter((p) => p);
    const moduleName = pathParts[0] || "ROOT";

    if (!modules[moduleName]) {
      modules[moduleName] = {
        name: moduleName,
        files: [],
      };
    }

    modules[moduleName].files.push(analysis);
  });

  return modules;
}

/**
 * Calculate module statistics
 */
function calculateModuleStats(moduleFiles) {
  const stats = {
    fileCount: moduleFiles.length,
    totalLines: 0,
    totalWords: 0,
    totalReadingTime: 0,
    totalCodeBlocks: 0,
    totalInlineCode: 0,
    totalImages: 0,
    totalExercises: 0,
    totalLinks: 0,
    avgComplexity: 0,
    avgWordsPerFile: 0,
    avgReadingTime: 0,
  };

  moduleFiles.forEach((file) => {
    stats.totalLines += file.lines;
    stats.totalWords += file.words;
    stats.totalReadingTime += file.readingTime;
    stats.totalCodeBlocks += file.codeBlocks;
    stats.totalInlineCode += file.inlineCode;
    stats.totalImages += file.images;
    stats.totalExercises += file.exercises;
    stats.totalLinks += file.links;
    stats.avgComplexity += file.complexityScore;
  });

  stats.avgComplexity = Math.round(stats.avgComplexity / moduleFiles.length);
  stats.avgWordsPerFile = Math.round(stats.totalWords / moduleFiles.length);
  stats.avgReadingTime = Math.round(
    stats.totalReadingTime / moduleFiles.length,
  );

  return stats;
}

/**
 * Detect missing elements
 */
function detectMissingElements(analyses) {
  const missing = [];

  analyses.forEach((file) => {
    const issues = [];

    if (file.images === 0) {
      issues.push("No images/screenshots");
    }

    if (file.exercises === 0) {
      issues.push("No practical exercises");
    }

    if (file.codeBlocks === 0 && file.path.includes("КНОПКА")) {
      issues.push("No code examples (expected for technical content)");
    }

    if (file.words < 100) {
      issues.push("Very short content (<100 words)");
    }

    if (file.headings.h2 === 0) {
      issues.push("No H2 headings (poor structure)");
    }

    if (issues.length > 0) {
      missing.push({
        file: file.path,
        issues,
      });
    }
  });

  return missing;
}

/**
 * Calculate content balance
 */
function calculateContentBalance(analyses) {
  let theoryWords = 0;
  let practiceWords = 0;

  analyses.forEach((file) => {
    const hasExercises = file.exercises > 0;
    const hasCode = file.codeBlocks > 0 || file.inlineCode > 0;

    if (hasExercises || hasCode) {
      practiceWords += file.words;
    } else {
      theoryWords += file.words;
    }
  });

  const total = theoryWords + practiceWords;
  const theoryPercent = total > 0 ? Math.round((theoryWords / total) * 100) : 0;
  const practicePercent =
    total > 0 ? Math.round((practiceWords / total) * 100) : 0;

  return {
    theoryWords,
    practiceWords,
    theoryPercent,
    practicePercent,
    balance:
      theoryPercent > 60
        ? "Theory-heavy"
        : practicePercent > 60
          ? "Practice-heavy"
          : "Balanced",
  };
}

/**
 * Generate human-readable summary
 */
function generateSummary(report) {
  const { total, modules, contentBalance, missing } = report;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 AI MUSIC PRODUCTION COURSE ANALYTICS REPORT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Overall statistics
  console.log("📈 OVERALL STATISTICS\n");
  console.log(`Total Files:           ${total.fileCount}`);
  console.log(`Total Modules:         ${Object.keys(modules).length}`);
  console.log(`Total Lines:           ${total.totalLines.toLocaleString()}`);
  console.log(`Total Words:           ${total.totalWords.toLocaleString()}`);
  console.log(
    `Total Reading Time:    ${total.totalReadingTime} minutes (${Math.round(total.totalReadingTime / 60)} hours)`,
  );
  console.log(`Average Words/File:    ${total.avgWordsPerFile}`);
  console.log(`Average Reading Time:  ${total.avgReadingTime} min/file`);
  console.log(
    `Average Complexity:    ${total.avgComplexity}% (technical density)`,
  );
  console.log();

  // Content elements
  console.log("📚 CONTENT ELEMENTS\n");
  console.log(`Code Blocks:           ${total.totalCodeBlocks}`);
  console.log(`Inline Code:           ${total.totalInlineCode}`);
  console.log(`Images/Screenshots:    ${total.totalImages}`);
  console.log(`Practical Exercises:   ${total.totalExercises}`);
  console.log(`External Links:        ${total.totalLinks}`);
  console.log();

  // Content balance
  console.log("⚖️  CONTENT BALANCE\n");
  console.log(
    `Theory:                ${contentBalance.theoryPercent}% (${contentBalance.theoryWords.toLocaleString()} words)`,
  );
  console.log(
    `Practice:              ${contentBalance.practicePercent}% (${contentBalance.practiceWords.toLocaleString()} words)`,
  );
  console.log(`Assessment:            ${contentBalance.balance}`);
  console.log();

  // Module breakdown
  console.log("📁 MODULE BREAKDOWN\n");
  Object.values(modules).forEach((module) => {
    console.log(`${module.name}:`);
    console.log(
      `  Files: ${module.stats.fileCount} | Words: ${module.stats.totalWords.toLocaleString()} | Reading: ${module.stats.totalReadingTime}min | Complexity: ${module.stats.avgComplexity}%`,
    );
    console.log(
      `  Images: ${module.stats.totalImages} | Exercises: ${module.stats.totalExercises} | Code: ${module.stats.totalCodeBlocks} blocks`,
    );
  });
  console.log();

  // Missing elements
  if (missing.length > 0) {
    console.log(`⚠️  MISSING ELEMENTS (${missing.length} files with issues)\n`);
    missing.slice(0, 10).forEach((item) => {
      console.log(`${item.file}:`);
      item.issues.forEach((issue) => console.log(`  - ${issue}`));
    });
    if (missing.length > 10) {
      console.log(`\n... and ${missing.length - 10} more files with issues`);
    }
    console.log();
  }

  // Top 5 longest files
  console.log("📄 TOP 5 LONGEST FILES\n");
  const sorted = [...report.fileAnalyses].sort((a, b) => b.words - a.words);
  sorted.slice(0, 5).forEach((file, index) => {
    console.log(`${index + 1}. ${file.path}`);
    console.log(
      `   ${file.words} words | ${file.readingTime}min | Complexity: ${file.complexityScore}%`,
    );
  });
  console.log();

  // Recommendations
  console.log("💡 RECOMMENDATIONS\n");

  if (contentBalance.theoryPercent > 70) {
    console.log("⚠️  Add more practical exercises and code examples");
  }

  if (total.totalExercises < total.fileCount * 0.5) {
    console.log("⚠️  Consider adding exercises to more lessons");
  }

  if (total.totalImages < total.fileCount * 0.8) {
    console.log("⚠️  Add more screenshots and visual aids");
  }

  if (total.avgComplexity > 15) {
    console.log("⚠️  High technical density - consider adding more examples");
  } else if (total.avgComplexity < 5) {
    console.log("⚠️  Low technical density - may need more technical depth");
  } else {
    console.log("✅ Good technical density balance");
  }

  if (missing.length > total.fileCount * 0.3) {
    console.log(
      "⚠️  Many files missing key elements - review content structure",
    );
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

/**
 * Main analysis function
 */
function analyzeCourse() {
  console.log("🔍 Scanning course files...\n");

  const markdownFiles = getAllMarkdownFiles(COURSE_DIR);
  console.log(`Found ${markdownFiles.length} markdown files\n`);

  console.log("📊 Analyzing content...\n");
  const fileAnalyses = markdownFiles.map(analyzeFile);

  console.log("📁 Grouping by modules...\n");
  const modules = groupByModule(fileAnalyses);

  // Calculate statistics
  Object.keys(modules).forEach((moduleName) => {
    modules[moduleName].stats = calculateModuleStats(modules[moduleName].files);
  });

  // Total statistics
  const total = {
    fileCount: fileAnalyses.length,
    totalLines: fileAnalyses.reduce((sum, f) => sum + f.lines, 0),
    totalWords: fileAnalyses.reduce((sum, f) => sum + f.words, 0),
    totalReadingTime: fileAnalyses.reduce((sum, f) => sum + f.readingTime, 0),
    totalCodeBlocks: fileAnalyses.reduce((sum, f) => sum + f.codeBlocks, 0),
    totalInlineCode: fileAnalyses.reduce((sum, f) => sum + f.inlineCode, 0),
    totalImages: fileAnalyses.reduce((sum, f) => sum + f.images, 0),
    totalExercises: fileAnalyses.reduce((sum, f) => sum + f.exercises, 0),
    totalLinks: fileAnalyses.reduce((sum, f) => sum + f.links, 0),
    avgComplexity: Math.round(
      fileAnalyses.reduce((sum, f) => sum + f.complexityScore, 0) /
        fileAnalyses.length,
    ),
    avgWordsPerFile: Math.round(
      fileAnalyses.reduce((sum, f) => sum + f.words, 0) / fileAnalyses.length,
    ),
    avgReadingTime: Math.round(
      fileAnalyses.reduce((sum, f) => sum + f.readingTime, 0) /
        fileAnalyses.length,
    ),
  };

  const contentBalance = calculateContentBalance(fileAnalyses);
  const missing = detectMissingElements(fileAnalyses);

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    total,
    modules,
    contentBalance,
    missing,
    fileAnalyses: fileAnalyses.sort((a, b) => a.path.localeCompare(b.path)),
  };

  // Save JSON report
  const jsonPath = path.join(COURSE_DIR, "course-analytics.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON report saved to: ${jsonPath}\n`);

  // Generate and display summary
  generateSummary(report);

  return report;
}

// Run analysis
if (require.main === module) {
  try {
    analyzeCourse();
  } catch (error) {
    console.error("❌ Error during analysis:", error);
    process.exit(1);
  }
}

module.exports = { analyzeCourse, analyzeFile };
