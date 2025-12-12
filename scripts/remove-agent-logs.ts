/**
 * 모든 파일에서 agent log 제거 스크립트
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function removeAgentLogs(filePath: string) {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // agent log 패턴 제거
    const patterns = [
      // #region agent log ... #endregion 블록
      /\/\/\s*#region\s+agent\s+log[\s\S]*?\/\/\s*#endregion/g,
      // 단일 fetch 호출
      /fetch\('http:\/\/127\.0\.0\.1:7243\/ingest\/[^']+',\{[^}]+\}\)\.catch\(\(\)=>\{\}\);/g,
      /fetch\('http:\/\/127\.0\.0\.1:7243\/ingest\/[^']+',\{[^}]+\}\)\.catch\(\(\)=>\{\}\)\n/g,
    ];
    
    let newContent = content;
    let changed = false;
    
    for (const pattern of patterns) {
      const matches = newContent.match(pattern);
      if (matches && matches.length > 0) {
        newContent = newContent.replace(pattern, '');
        changed = true;
      }
    }
    
    // 빈 줄 정리
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (changed) {
      await writeFile(filePath, newContent, 'utf-8');
      console.log(`✅ Cleaned: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function processDirectory(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  let cleanedCount = 0;
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // node_modules, .next 등 제외
      if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      cleanedCount += await processDirectory(fullPath);
    } else if (entry.isFile()) {
      // TypeScript, JavaScript 파일만 처리
      if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
        const cleaned = await removeAgentLogs(fullPath);
        if (cleaned) cleanedCount++;
      }
    }
  }
  
  return cleanedCount;
}

async function main() {
  console.log('🧹 Removing agent logs...\n');
  const cleanedCount = await processDirectory(process.cwd());
  console.log(`\n✅ Cleaned ${cleanedCount} files`);
}

main().catch(console.error);

