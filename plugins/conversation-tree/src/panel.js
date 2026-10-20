import { openThread } from './navigation.mjs';
import { layoutTreeNodes } from './layout.mjs';
import { App, applyDocumentTheme, applyHostStyleVariables } from '@modelcontextprotocol/ext-apps';
const $ = id => document.getElementById(id);
const app = new App({ name: 'conversation-tree', version: '0.2.14' }, {}, { autoResize: true });
let current, liveSnapshot, selectedId, selectedBranch, dialogAction, dialogNode;
let bridgeReady = false, loading = false, timer, graphSignature = '';
let layoutRoot = null, layoutOffsets = new Map();
let zoomScale = 1;
let canvasHeight = 420;
const preview = window.parent === window;
let token = new URLSearchParams(location.hash.slice(1)).get('token');
if(preview){try{if(token)sessionStorage.setItem('tree-preview-token',token);else token=sessionStorage.getItem('tree-preview-token');}catch{}}
if (preview && token && location.hash) history.replaceState(null, '', location.pathname);

function notice(text) { $('notice').textContent=text; $('notice').hidden=!text; }
function activateLayout(snapshot) {
  const root=snapshot.rootThreadId;
  if(layoutRoot===root)return;
  layoutRoot=root;layoutOffsets=new Map();
  zoomScale=1;canvasHeight=420;
  try{
    const saved=JSON.parse(localStorage.getItem(`conversation-tree-layout-v2:${root}`)||'{}');
    for(const [id,point] of Object.entries(saved))if(Number.isFinite(point?.x)&&Number.isFinite(point?.y))layoutOffsets.set(id,point);
    const savedZoom=Number(localStorage.getItem(`conversation-tree-zoom-v1:${root}`));
    if(Number.isFinite(savedZoom)&&savedZoom>=.4&&savedZoom<=2.5)zoomScale=savedZoom;
    const savedHeight=Number(localStorage.getItem(`conversation-tree-canvas-height-v1:${root}`));
    if(Number.isFinite(savedHeight)&&savedHeight>=200&&savedHeight<=1600)canvasHeight=savedHeight;
  }catch{}
  $('canvas').style.height=`${canvasHeight}px`;
}
function saveLayout(){
  if(!current)return;
  try{localStorage.setItem(`conversation-tree-layout-v2:${current.rootThreadId}`,JSON.stringify(Object.fromEntries(layoutOffsets)));}catch{}
}
function applyZoom(){
  $('graph').style.zoom=String(zoomScale);
  $('zoom').textContent=`${Math.round(zoomScale*100)}%`;
}
function saveZoom(){
  if(!current)return;
  try{localStorage.setItem(`conversation-tree-zoom-v1:${current.rootThreadId}`,String(zoomScale));}catch{}
}
function unwrap(result) {
  if (result.isError) throw new Error(result.content?.find(item => item.type==='text')?.text || '操作未完成');
  const value=result._meta?.tree;
  if (!value) throw new Error('宿主未回傳面板資料（_meta.tree）');
  return value;
}
async function call(name,args={}) {
  if (preview) {
    const response=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({name,args})});
    const value=await response.json();
    if(!response.ok) throw new Error(value.error || '本機連線失敗');
    return value;
  }
  return unwrap(await app.callServerTool({name,arguments:args}));
}
function setSnapshot(snapshot) {
  const previousIds=current?.rootThreadId===snapshot.rootThreadId?new Set(current.nodes.map(node=>node.id)):null;
  const newestBranchNode=previousIds?snapshot.nodes.filter(node=>node.threadId!==snapshot.rootThreadId&&!previousIds.has(node.id)).at(-1):null;
  liveSnapshot=snapshot;
  current=snapshot;
  activateLayout(snapshot);
  if(!selectedBranch || !snapshot.branches.some(branch=>branch.id===selectedBranch)) selectedBranch=snapshot.rootThreadId;
  render();
  if(newestBranchNode) requestAnimationFrame(()=>scrollGraphNodeIntoView(newestBranchNode.id));
}
function scrollGraphNodeIntoView(nodeId) {
  const canvas=$('canvas');
  const card=[...$('nodes').children].find(element=>element.dataset.nodeId===nodeId);
  if(!card)return;
  const viewport=canvas.getBoundingClientRect(),rect=card.getBoundingClientRect(),margin=24;
  let dx=0,dy=0;
  if(rect.left<viewport.left+margin)dx=rect.left-(viewport.left+margin);
  else if(rect.right>viewport.right-margin)dx=rect.right-(viewport.right-margin);
  if(rect.top<viewport.top+margin)dy=rect.top-(viewport.top+margin);
  else if(rect.bottom>viewport.bottom-margin)dy=rect.bottom-(viewport.bottom-margin);
  if(dx||dy)canvas.scrollTo({left:canvas.scrollLeft+dx,top:canvas.scrollTop+dy,behavior:'smooth'});
}
async function navigate(threadId, prefix = '', node = null) {
  try {
    if(node && !preview) await call('tree_reveal',{rootThreadId:current.rootThreadId,nodeId:node.id});
    await openThread(app, threadId, {preview});
    notice(prefix + (node?'已將定位指令送至桌面橋接器。':'已向 Codex 請求開啟聊天。'));
  }
  catch(error) { notice(prefix + error.message + ' 可點節點重試開啟，無須再次建立分支。'); }
}
function select(node) {
  selectedId=node.id;
  selectedBranch=node.threadId;
  render();
  $('detail').scrollIntoView({behavior:'smooth',block:'nearest'});
  void navigate(node.threadId, '', node);
}
function render() {
  if(!current) return;
  $('source').textContent=current.name;
  const branch=current.branches.find(item=>item.id===selectedBranch);
  $('path').textContent=branch?.name || '主線';
  $('count').textContent=`${current.nodes.length} 個提示詞 · ${current.branches.length-1} 條支線`;
  $('sync').textContent=`已同步 ${new Date(current.refreshedAt).toLocaleTimeString('zh-TW',{hour12:false})}`;
  const signature=JSON.stringify([current.nodes,current.branches,selectedId,selectedBranch]);
  if(signature!==graphSignature){graphSignature=signature;renderGraph();}
  const node=current.nodes.find(item=>item.id===selectedId);
  $('detail').hidden=!node;
  if(node){$('detail-title').textContent=node.title;$('prompt').textContent=node.text;
    $('detail-hint').textContent=`下方為所選提示詞；使用桌面橋接啟動 Codex 後，點節點會觸發原生小白條定位。${node.branchable?'':'此節點尚不符合已完成回合分支條件。'}`;}
}
function renderGraph(){
  const all=[...current.nodes];
  for(const branch of current.branches){
    if(branch.parentNodeId && !all.some(node=>node.threadId===branch.id) && !current.branches.some(child=>child.parentThreadId===branch.id && all.some(node=>node.threadId===child.id))) all.push({id:`empty:${branch.id}`,parentId:branch.parentNodeId,threadId:branch.id,title:branch.name,empty:true});
  }
  const byId=new Map(all.map(node=>[node.id,node]));
  const {positions}=layoutTreeNodes(all,current.branches,current.rootThreadId,layoutOffsets);
  $('nodes').replaceChildren();$('edges').replaceChildren();
  const resizeGraph=()=>{
    let width=240,height=200;
    for(const point of positions.values()){width=Math.max(width,point.x+205);height=Math.max(height,point.y+99);}
    $('graph').style.width=`${width}px`;$('graph').style.height=`${height}px`;$('edges').setAttribute('width',width);$('edges').setAttribute('height',height);
  };
  const drawEdges=()=>{
    $('edges').replaceChildren();
    for(const node of all){const parent=byId.get(node.parentId);if(!parent)continue;const pp=positions.get(parent.id),p=positions.get(node.id);const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      if(parent.threadId===node.threadId)path.setAttribute('d',`M ${pp.x+180} ${pp.y+34} C ${pp.x+194} ${pp.y+34}, ${p.x-14} ${p.y+34}, ${p.x} ${p.y+34}`);
      else path.setAttribute('d',`M ${pp.x+90} ${pp.y+68} C ${pp.x+90} ${pp.y+86}, ${p.x+90} ${p.y-18}, ${p.x+90} ${p.y}`);
      $('edges').append(path);}
  };
  for(const node of all){
    const p=positions.get(node.id);
    const card=document.createElement('div');card.dataset.nodeId=node.id;card.className=`node${node.id===selectedId?' selected':''}${node.empty?' select-branch':''}`;card.style.left=`${p.x}px`;card.style.top=`${p.y}px`;
    const button=document.createElement('button');button.className='node-main';button.title=node.title;button.setAttribute('aria-pressed',String(node.id===selectedId));
    const title=document.createElement('span');title.className='node-title';title.textContent=node.title;
    const meta=document.createElement('span');meta.className='node-meta';meta.textContent=node.empty?'新支線 · 等待第一則提示詞':`${node.threadId===current.rootThreadId?'主線':'支線'} · ${node.status==='completed'?'已完成':'進行中或已中斷'}`;
    let suppressClick=false;
    button.append(title,meta);button.onclick=()=>{if(suppressClick){suppressClick=false;return;}if(node.empty){selectedBranch=node.threadId;render();void navigate(node.threadId);}else select(node);};card.append(button);
    if(node.branchable){const fork=document.createElement('button');fork.className='fork';fork.textContent='＋ 建立分支';fork.setAttribute('aria-label',`從「${node.title}」建立分支`);fork.onclick=()=>openDialog('fork',node);card.append(fork);}
    let holdTimer=null,dragging=false,startX=0,startY=0,startPoint=null,startOffset=null;
    card.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.target.closest('.fork'))return;
      startX=event.clientX;startY=event.clientY;startPoint={...positions.get(node.id)};startOffset={...(layoutOffsets.get(node.id)||{x:0,y:0})};
      card.setPointerCapture?.(event.pointerId);
      holdTimer=setTimeout(()=>{dragging=true;card.classList.add('dragging');},220);
    });
    card.addEventListener('pointermove',event=>{
      if(!holdTimer&&!dragging)return;
      const dx=(event.clientX-startX)/zoomScale,dy=(event.clientY-startY)/zoomScale;
      if(!dragging&&Math.hypot(dx,dy)>6){clearTimeout(holdTimer);holdTimer=null;return;}
      if(!dragging)return;
      event.preventDefault();
      const next={x:Math.max(8,startPoint.x+dx),y:Math.max(8,startPoint.y+dy),depth:startPoint.depth};
      layoutOffsets.set(node.id,{x:startOffset.x+(next.x-startPoint.x),y:startOffset.y+(next.y-startPoint.y)});
      positions.set(node.id,next);card.style.left=`${next.x}px`;card.style.top=`${next.y}px`;resizeGraph();drawEdges();
    });
    const finishDrag=()=>{
      clearTimeout(holdTimer);holdTimer=null;
      if(!dragging)return;
      dragging=false;suppressClick=true;card.classList.remove('dragging');saveLayout();resizeGraph();drawEdges();
    };
    card.addEventListener('pointerup',finishDrag);card.addEventListener('pointercancel',finishDrag);
    $('nodes').append(card);
  }
  resizeGraph();drawEdges();applyZoom();
  $('empty').hidden=all.length>0;$('graph').hidden=all.length===0;
}
function openDialog(action,node){
  dialogAction=action;dialogNode=node;$('dialog-error').textContent='';
  $('dialog-title').textContent=action==='rename'?'為節點換個名字':'從這裡建立分支';
  $('dialog-description').textContent=action==='rename'?'修改樹上的標題，原始提示詞保持不變。':`從「${node.title}」所在的已完成回合建立獨立聊天。建立後透過宿主開啟新聊天，再直接在聊天框輸入。工作目錄共用。`;
  $('confirm').textContent=action==='rename'?'保存名稱':'建立獨立聊天';
  $('branch-name').value=action==='rename'?node.title:'';$('dialog').showModal();$('branch-name').focus();
}
$('cancel').onclick=()=>$('dialog').close();
$('branch-form').onsubmit=async event=>{
  event.preventDefault();const name=$('branch-name').value.trim();if(!name)return;
  $('confirm').disabled=true;
  try{
    if(dialogAction==='rename')setSnapshot(await call('tree_rename',{rootThreadId:current.rootThreadId,nodeId:dialogNode.id,title:name}));
    else{const result=await call('tree_fork',{rootThreadId:current.rootThreadId,nodeId:dialogNode.id,name});selectedBranch=result.branch.id;setSnapshot(result.snapshot);$('dialog').close();await navigate(result.branch.id, (result.warning ? result.warning+'\n' : '')+`已建立「🌿 ${name}」。`);}
    $('dialog').close();
  }catch(error){$('dialog-error').textContent=error.message;}finally{$('confirm').disabled=false;}
};
$('rename').onclick=()=>openDialog('rename',current.nodes.find(node=>node.id===selectedId));
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(current.nodes.find(node=>node.id===selectedId).text);notice('提示詞已複製。');}catch{notice('宿主未開放剪貼簿；可直接選取上方原文複製。');}};
$('mainline').onclick=()=>{if(!current)return;selectedBranch=current.rootThreadId;const nodes=current.nodes.filter(node=>node.threadId===selectedBranch);selectedId=nodes.at(-1)?.id;render();$('canvas').scrollTo({left:0,top:0,behavior:'smooth'});void navigate(current.rootThreadId);};
$('refresh').onclick=()=>refresh(true);
$('canvas').addEventListener('wheel',event=>{
  if(!current)return;
  event.preventDefault();
  const canvas=$('canvas'),rect=canvas.getBoundingClientRect(),localX=event.clientX-rect.left,localY=event.clientY-rect.top;
  const contentX=(canvas.scrollLeft+localX)/zoomScale,contentY=(canvas.scrollTop+localY)/zoomScale;
  const next=Math.min(2.5,Math.max(.4,zoomScale*Math.exp(-event.deltaY*.0015)));
  if(Math.abs(next-zoomScale)<.001)return;
  zoomScale=next;applyZoom();
  canvas.scrollLeft=contentX*zoomScale-localX;canvas.scrollTop=contentY*zoomScale-localY;saveZoom();
},{passive:false});
new ResizeObserver(entries=>{
  const height=Math.round($('canvas').getBoundingClientRect().height||0);
  if(!current||height<200||Math.abs(height-canvasHeight)<2)return;
  canvasHeight=height;
  try{localStorage.setItem(`conversation-tree-canvas-height-v1:${current.rootThreadId}`,String(canvasHeight));}catch{}
}).observe($('canvas'));
async function refresh(manual=false){
  if(!bridgeReady||loading||$('dialog').open)return;
  loading=true;
  try{const snapshot=await call(liveSnapshot?'tree_snapshot':'tree_open',liveSnapshot?{rootThreadId:liveSnapshot.rootThreadId}:{});
    liveSnapshot=snapshot;
    setSnapshot(snapshot);if(snapshot.warnings.length)notice(snapshot.warnings.join('\n'));else if(manual)notice('已讀取最新的本機對話歷史。');}
  catch(error){notice(error.message);}finally{loading=false;}
}
app.ontoolresult=result=>{try{const value=unwrap(result);const snapshot=value.snapshot||value;if(snapshot.nodes)setSnapshot(snapshot);}catch(error){notice(error.message);}};
app.onhostcontextchanged=context=>{if(context.theme)applyDocumentTheme(context.theme);if(context.styles?.variables)applyHostStyleVariables(context.styles.variables);};
async function start(){
  try{
    if(!preview) await app.connect();
    bridgeReady=true;
    $('diagnostic-text').textContent=preview?'環境：本機瀏覽器預覽（不是原生插件面板）\n資料：真實本機 Codex 歷史\n原生訊息跳轉：需要桌面橋接':JSON.stringify({environment:'MCP App',hostCapabilities:app.getHostCapabilities(),nativeMessageJump:'desktop-bridge',nativeBranchSwitch:!!app.getHostCapabilities()?.openLinks},null,2);
    if(!liveSnapshot) await refresh();
    timer=setInterval(()=>{if(!document.hidden)refresh();},3000);
  }catch(error){notice(error.message);}
}
window.addEventListener('pagehide',()=>clearInterval(timer));
start();
