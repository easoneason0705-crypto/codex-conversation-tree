import { mkdir, copyFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const destination=resolve('../../packages/conversation-tree');
await rm(destination,{recursive:true,force:true});
await mkdir(join(destination,'dist'),{recursive:true});
await mkdir(join(destination,'.codex-plugin'),{recursive:true});
for(const path of ['plugin.json','mcp.json','.codex-plugin/plugin.json','.mcp.json','dist/server.mjs','dist/panel.html'])await copyFile(path,join(destination,path));
console.log(`Plugin packaged at ${destination}`);
