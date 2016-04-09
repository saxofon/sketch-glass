require("setimmediate");
require("babelify/polyfill");
import CanvasView from './view/CanvasView';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = new CanvasView();
  document.body.appendChild(canvas.element);
});
