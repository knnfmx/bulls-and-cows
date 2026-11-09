// Хелпер для создания DOM-узлов без innerHTML

export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Omit<HTMLElementTagNameMap[K], 'style' | 'children'>> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  Object.assign(node, props);
  children.forEach((child) => node.append(child));
  return node;
};

export const mount = (root: HTMLElement, children: (Node | string)[]): void => {
  while (root.firstChild) root.removeChild(root.firstChild);
  children.forEach((child) => root.append(child));
};
