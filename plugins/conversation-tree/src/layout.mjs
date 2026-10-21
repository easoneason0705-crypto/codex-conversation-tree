export function layoutTreeNodes(nodes, branches, rootThreadId, offsets = new Map()) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const visibleThreadIds = new Set(nodes.map(node => node.threadId));
  const orderedThreadIds = [rootThreadId, ...branches.map(branch => branch.id)
    .filter(id => id !== rootThreadId && visibleThreadIds.has(id))];
  const lanes = new Map();
  for (const [index, id] of [...new Set(orderedThreadIds)].entries()) {
    // Keep the mainline in the middle, then distribute branches left and
    // right in creation order: -1, +1, -2, +2, ...
    const lane = index === 0 ? 0 : (index % 2 ? -Math.ceil(index / 2) : index / 2);
    lanes.set(id, lane);
  }
  const leftmostLane = Math.min(0, ...lanes.values());
  const mainlineX = 26 + Math.abs(leftmostLane) * 210;
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
      x: mainlineX + (lanes.get(node.threadId) || 0) * 210,
      y: parentBase ? (sameThread ? parentBase.y + 102 : parentPoint.y) : 30,
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
