import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
test('packaged MCP exposes a thread entrypoint, private UI tools and self-contained HTML',async()=>{
  const client=new Client({name:'tree-test',version:'0.1.0'});
  const transport=new StdioClientTransport({command:process.execPath,args:['dist/server.mjs'],stderr:'pipe'});
  try{
    await client.connect(transport);
    const {tools}=await client.listTools();
    const open=tools.find(tool=>tool.name==='tree_open');
    assert.deepEqual(open._meta['openai/ui'].entrypoints,[{type:'thread'}]);
    assert.equal(open.inputSchema.required?.length||0,0);
    assert.deepEqual(tools.find(tool=>tool.name==='tree_fork')._meta.ui.visibility,['app']);
    assert.deepEqual(tools.find(tool=>tool.name==='tree_reveal')._meta.ui.visibility,['app']);
    assert.equal(tools.find(tool=>tool.name==='tree_reveal').annotations.readOnlyHint,true);
    assert.equal(tools.find(tool=>tool.name==='tree_fork').annotations.readOnlyHint,false);
    const resource=await client.readResource({uri:open._meta.ui.resourceUri});
    assert.match(resource.contents[0].mimeType,/text\/html/);
    assert.ok(resource.contents[0].text.includes('原生定位'));
    assert.ok(resource.contents[0].text.includes('桌面橋接'));
    assert.ok(resource.contents[0].text.includes('↻ 更新'));
    assert.ok(!resource.contents[0].text.includes('午餐示例'));
    assert.ok(!resource.contents[0].text.includes('把思路，留在路上'));
    assert.ok(!resource.contents[0].text.includes('/* INLINE_SCRIPT */'));
  }finally{await client.close();}
});
