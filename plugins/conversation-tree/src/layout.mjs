export function layoutTreeNodes(nodes, branches, rootThreadId, offsets = new Map()) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const visibleThreadIds = new Set(nodes.map(node => node.threadId));
  const orderedThreadIds = [rootThreadId, ...branches.map(branch => branch.id)
    .filter(id => id !== rootThreadId && visibleThreadIds.has(id))];
  const lanes = new Map([...new Set(orderedThreadIds)].map((id, index) => [id, index]));
  const bases = new Map(), positions = new Map();

  function position(node, visiting = new Set()) {
    if (positions.has(node.id)) return positions.get(node.id);
    if (visiting.has(node.id)) throw new Error('樹關係出現循環');
    const nextVisiting = new Set(visiting); nextVisiting.add(node.id);
    const parent = byId.get(node.parentId);
    const parentPoint = parent ? position(parent, nextVisiting) : null;
    const parentBase = parent ? bases.get(parent.id) : null;
    const sameThread = parent?.threadId === node.threadId;
    const depth = parentBase ? (sameThread ? parentBase.depth + 1 : parentBase.depth) : 0;
    const base = {
      x: parentBase ? (sameThread ? parentBase.x + 210 : parentPoint.x) : 26,
      y: 30 + (lanes.get(node.threadId) || 0) * 102,
      depth,
    };
    bases.set(node.id, base);
    const offset = offsets.get(node.id) || { x: 0, y: 0 };
    const point = { x: Math.max(8, base.x + offset.x), y: Math.max(8, base.y + offset.y), depth };
    positions.set(node.id, point);
    return point;
  }

  for (const node of nodes) position(node);
  return { positions, lanes };
}
