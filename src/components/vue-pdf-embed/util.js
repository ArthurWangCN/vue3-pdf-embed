export function emptyElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function releaseChildCanvases(el) {
  el.querySelectorAll('canvas').forEach(canvas => {
    canvas.width = 1;
    canvas.height = 1;
    canvas.getContext('2d')?.clearRect(0, 0, 1, 1);
  });
}
