// scrollt die baumfläche (.pb-tree-scroll) so, dass ein knoten in der mitte liegt, waagerecht und senkrecht
// genutzt von syntax- und semantikübung
// baum kleiner als die fläche: browser scrollt nur bis zum rand, dann ändert sich nichts
// position aus getBoundingClientRect() statt offsetLeft/offsetTop, damit sie nicht vom offsetParent abhängt
// weich scrollen, außer "bewegung reduzieren" ist eingestellt
export function zentriere(scrollEl, knoten) {
  if (!scrollEl || !knoten) return;
  const k = knoten.getBoundingClientRect();
  const s = scrollEl.getBoundingClientRect();
  // ziel: knotenmitte (relativ zur fläche) minus halbe sichtbare fläche
  const links = scrollEl.scrollLeft + (k.left - s.left) + k.width / 2 - scrollEl.clientWidth / 2;
  const oben = scrollEl.scrollTop + (k.top - s.top) + k.height / 2 - scrollEl.clientHeight / 2;
  const reduziert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollEl.scrollTo({ left: Math.max(0, links), top: Math.max(0, oben), behavior: reduziert ? 'auto' : 'smooth' });
}
