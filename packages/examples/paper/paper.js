import paper from 'paper'

const canvas = document.getElementById('canvas');
// Create an empty project and a view for the canvas:
paper.setup(canvas);
// Create a Paper.js Path to draw a line into it:
const {Point, Size, Shape, Path, view} = paper

const topLeft = new Point(0, 21);
const rectSize = new Size(50, 20);
const rect = new Shape.Rectangle(topLeft, rectSize);
rect.fillColor = '#e9e9ff';
// path.selected = true;
// Draw the view now:
view.draw();

setTimeout(() => {
  // path.position = new Point(100, 200)
  // path.bounds = new Rectangle(topLeft, new Size(200, 200))
  // view.draw();
  // canvas.style.width = `500px`
  // canvas.style.height = '500px'
  view.setViewSize(500, 500)
}, 1000)