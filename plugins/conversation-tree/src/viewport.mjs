export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 2.5;
export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 68;

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function createWorldGeometry(positions, viewport, scale = 1) {
  const safeScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, finite(scale, 1)));
  const logicalWidth = Math.max(1, finite(viewport?.width, 1) / safeScale);
  const logicalHeight = Math.max(1, finite(viewport?.height, 1) / safeScale);
  const paddingX = Math.max(240, logicalWidth * 0.6);
  const paddingY = Math.max(180, logicalHeight * 0.6);
  let contentRight = NODE_WIDTH;
  let contentBottom = NODE_HEIGHT;

  for (const point of positions.values()) {
    contentRight = Math.max(contentRight, finite(point?.x) + NODE_WIDTH);
    contentBottom = Math.max(contentBottom, finite(point?.y) + NODE_HEIGHT);
  }

  return {
    offsetX: paddingX,
    offsetY: paddingY,
    width: Math.ceil(contentRight + paddingX * 2),
    height: Math.ceil(contentBottom + paddingY * 2),
  };
}

export function centerOfNodes(nodes, positions) {
  const points = nodes.map(node => positions.get(node.id)).filter(Boolean);
  if (!points.length) return null;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const point of points) {
    left = Math.min(left, point.x);
    top = Math.min(top, point.y);
    right = Math.max(right, point.x + NODE_WIDTH);
    bottom = Math.max(bottom, point.y + NODE_HEIGHT);
  }
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

export function scrollForCenter(center, world, viewport, scale = 1) {
  if (!center) return { left: 0, top: 0 };
  const safeScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, finite(scale, 1)));
  const maxLeft = Math.max(0, world.width * safeScale - viewport.width);
  const maxTop = Math.max(0, world.height * safeScale - viewport.height);
  return {
    left: Math.min(maxLeft, Math.max(0, (center.x + world.offsetX) * safeScale - viewport.width / 2)),
    top: Math.min(maxTop, Math.max(0, (center.y + world.offsetY) * safeScale - viewport.height / 2)),
  };
}

export function panWithinWorld(start, delta, world, viewport, scale = 1) {
  const safeScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, finite(scale, 1)));
  const maxLeft = Math.max(0, world.width * safeScale - viewport.width);
  const maxTop = Math.max(0, world.height * safeScale - viewport.height);
  return {
    left: Math.min(maxLeft, Math.max(0, finite(start?.left) - finite(delta?.x))),
    top: Math.min(maxTop, Math.max(0, finite(start?.top) - finite(delta?.y))),
  };
}
