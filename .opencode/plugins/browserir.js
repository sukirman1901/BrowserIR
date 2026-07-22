/**
 * BrowserIR plugin for OpenCode
 *
 * Injects BrowserIR skill bootstrap context into agent conversations.
 * MCP server is registered separately in global opencode.json (mcp.bir).
 * Skill is loaded from .opencode/skills/bir/SKILL.md (auto-discovered).
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };
  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};
  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }
  return { frontmatter, content: body };
};

export const BrowserIRPlugin = async ({ client, directory }) => {
  const skillPath = path.resolve(__dirname, '../skills/bir/SKILL.md');

  const getBootstrapContent = () => {
    if (!fs.existsSync(skillPath)) return null;
    const fullContent = fs.readFileSync(skillPath, 'utf8');
    const { content } = extractAndStripFrontmatter(fullContent);
    return `<EXTREMELY_IMPORTANT>
You have BROWSERIR SEMANTIC UNDERSTANDING.

**IMPORTANT: The BrowserIR skill content is included below. It is ALREADY LOADED - you are currently following it.**

${content}
</EXTREMELY_IMPORTANT>`;
  };

  return {
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;

      const firstUser = output.messages.find(m => m.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;
      if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('BROWSERIR SEMANTIC UNDERSTANDING'))) return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    },
  };
};