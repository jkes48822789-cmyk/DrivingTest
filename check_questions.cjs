const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');

// 1. Parse questionBank array
const startMatch = content.indexOf('const questionBank = [');
const endMatch = content.indexOf('];', startMatch);
const arrayText = content.substring(startMatch + 'const questionBank = ['.length, endMatch).trim();

const lines = arrayText.split('\n');
const questions = [];
const hasSignIds = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith('//')) continue;
  
  let cleanedLine = line;
  if (cleanedLine.endsWith(',')) {
    cleanedLine = cleanedLine.slice(0, -1);
  }
  
  try {
    const obj = eval(`(${cleanedLine})`);
    questions.push(obj);
    if (obj.hasSign) {
      hasSignIds.push(obj.id);
    }
  } catch (e) {
    // Ignore line parse error if any
  }
}

console.log(`Loaded ${questions.length} questions from questionBank.`);
console.log(`Found ${hasSignIds.length} questions with hasSign: true.`);

// 2. Parse all "case <id>:" from the switch-case in index.html
// Let's find cases inside index.html using regex: case \d+:
const caseRegex = /case\s+(\d+)\s*:/g;
const caseIds = [];
let match;
while ((match = caseRegex.exec(content)) !== null) {
  caseIds.push(parseInt(match[1], 10));
}

// Keep only unique case IDs
const uniqueCaseIds = [...new Set(caseIds)].sort((a, b) => a - b);
console.log(`Found ${uniqueCaseIds.length} total render cases in the switch statements.`);

// 3. Find missing rendering cases
const missingCases = hasSignIds.filter(id => !uniqueCaseIds.includes(id));
if (missingCases.length > 0) {
  console.log(`🔴 ERROR: The following ${missingCases.length} questions have hasSign: true but are MISSING a rendering case:`, missingCases);
} else {
  console.log(`🟢 SUCCESS: All questions with hasSign: true have a corresponding render case!`);
}

// 4. Find extra rendering cases that are not in questionBank or don't have hasSign: true
const questionsMap = {};
questions.forEach(q => { questionsMap[q.id] = q; });

const extraCases = uniqueCaseIds.filter(id => {
  const q = questionsMap[id];
  return !q || !q.hasSign;
});
if (extraCases.length > 0) {
  console.log(`🟡 INFO: The following ${extraCases.length} render cases exist but are not in the question bank or don't have hasSign: true:`, extraCases);
}
