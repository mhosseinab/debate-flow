// PreToolUse(Edit|Write) guard: block writes to secret files.
// .env holds the live GEMINI_API_KEY — edits should go to env.example instead.
let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  let filePath = '';
  try {
    filePath = JSON.parse(data).tool_input?.file_path || '';
  } catch {
    process.exit(0); // can't parse → don't block
  }
  if (/(^|\/)\.env($|\.)/.test(filePath)) {
    console.error(
      `Blocked write to ${filePath}: this file holds secrets (GEMINI_API_KEY). ` +
        `Edit env.example for placeholders, or change the value manually.`
    );
    process.exit(2); // exit 2 → block the tool call, surface stderr to Claude
  }
  process.exit(0);
});
