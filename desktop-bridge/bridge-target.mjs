export function isPrimaryCodexPage(target) {
  return target?.type === 'page' && target.url === 'app://-/index.html';
}
