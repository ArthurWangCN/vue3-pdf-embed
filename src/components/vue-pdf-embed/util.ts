export function emptyElement(el: HTMLDivElement) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function releaseChildCanvases(el: HTMLDivElement) {
  el.querySelectorAll('canvas').forEach(canvas => {
    canvas.width = 1;
    canvas.height = 1;
    canvas.getContext('2d')?.clearRect(0, 0, 1, 1);
  });
}
