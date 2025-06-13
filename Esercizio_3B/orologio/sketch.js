let activityInputs = [];
let colors = [
  "#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed",
  "#be185d", "#0891b2", "#4b5563", "#ea580c", "#65a30d"
];

let canvasParent;
let clockCanvas;
let justSelectedColor = false;

function setup() {
  noCanvas();
  createLayout();
  createActivityInputs();
  clockCanvas = createCanvas(600, 600);
  clockCanvas.parent(canvasParent);
}

function windowResized() {
  updateCanvasSize();
}

function draw() {
  background(248, 250, 252);

  let s = min(width, height) / 600;
  translate(width / 2, height / 2);
  scale(s);

  drawCleanClock();
  drawActivitySectors();
}

function drawCleanClock() {
  strokeWeight(2);
  stroke(71, 85, 105);
  fill(255, 255, 255);
  ellipse(0, 0, 400, 400);

  drawCleanNumbers();
  drawMinimalTicks();
  drawPreciseHands();
  drawMinimalCenter();
}

function drawCleanNumbers() {
  textAlign(CENTER, CENTER);
  textSize(24);
  textStyle(NORMAL);
  fill(15, 23, 42);

  for (let i = 1; i <= 12; i++) {
    push();
    let angle = (i * TWO_PI / 12) - HALF_PI;
    let x = cos(angle) * 150;
    let y = sin(angle) * 150;
    text(i, x, y);
    pop();
  }
}

function drawMinimalTicks() {
  stroke(71, 85, 105);
  for (let i = 0; i < 60; i++) {
    push();
    rotate(i / 60 * TWO_PI);
    if (i % 5 === 0) {
      strokeWeight(2);
      line(0, -190, 0, -175);
    } else {
      strokeWeight(1);
      line(0, -190, 0, -183);
    }
    pop();
  }
}

function drawPreciseHands() {
  push();
  let h = hour() % 12 + minute() / 60;
  rotate(h / 12 * TWO_PI);
  strokeWeight(6);
  stroke(15, 23, 42);
  line(0, 15, 0, -100);
  strokeWeight(4);
  line(0, -100, 0, -110);
  pop();

  push();
  let m = minute();
  rotate(m / 60 * TWO_PI);
  strokeWeight(4);
  stroke(15, 23, 42);
  line(0, 15, 0, -160);
  strokeWeight(2);
  line(0, -160, 0, -170);
  pop();

  push();
  let s = second();
  rotate(s / 60 * TWO_PI);
  strokeWeight(2);
  stroke(220, 38, 38);
  line(0, 20, 0, -175);
  noStroke();
  fill(220, 38, 38);
  ellipse(0, -175, 8, 8);
  pop();
}

function drawMinimalCenter() {
  strokeWeight(2);
  stroke(71, 85, 105);
  fill(255, 255, 255);
  ellipse(0, 0, 20, 20);
  noStroke();
  fill(15, 23, 42);
  ellipse(0, 0, 8, 8);
}

function drawActivitySectors() {
  let radius = 280;
  let now = hour() * 60 + minute();

  activityInputs.forEach(row => {
    let timeVal = row.time.value().trim();
    let labelVal = row.label.value();
    let colorVal = row.color.elt.dataset.color;

    if (timeVal.includes("-") && labelVal.trim() !== "") {
      let [startStr, endStr] = timeVal.split("-").map(s => s.trim());
      let [sh, sm] = startStr.split(":" ).map(Number);
      let [eh, em] = endStr.split(":" ).map(Number);

      let startMin = sh * 60 + sm;
      let endMin = eh * 60 + em;

      if (now >= endMin) return; // Rimuove attività passate

      let startA = timeToAngle(startStr);
      let endA = timeToAngle(endStr);

      if (!isNaN(startA) && !isNaN(endA)) {
        fill(red(colorVal), green(colorVal), blue(colorVal), 100);
        stroke(colorVal);
        strokeWeight(2);

        let drawEndA = endA;
        if (endA <= startA) drawEndA += TWO_PI;

        arc(0, 0, radius * 2, radius * 2, startA, drawEndA, PIE);

        let midAngle = (startA + drawEndA) / 2;
        let textRadius = radius * 0.8;
        let labelX = cos(midAngle) * textRadius;
        let labelY = sin(midAngle) * textRadius;

        push();
        translate(labelX, labelY);
        textAlign(CENTER, CENTER);
        textSize(14);
        let textW = textWidth(labelVal) + 16;
        let textH = 24;
        strokeWeight(2);
        stroke(colorVal);
        fill(255, 255, 255, 250);
        rect(-textW / 2, -textH / 2, textW, textH, 4);
        noStroke();
        fill(15, 23, 42);
        textStyle(BOLD);
        text(labelVal, 0, 0);
        pop();
      }
    }
  });
}

function timeToAngle(timeStr) {
  let [h, m] = timeStr.split(":" ).map(Number);
  if (isNaN(h) || isNaN(m)) return NaN;
  let totalMinutes = h * 60 + m;
  let angle = (totalMinutes / (12 * 60)) * TWO_PI;
  return angle - HALF_PI;
}

// Resto del codice invariato...


function createLayout() {
  let wrapper = createDiv().id('main-wrapper').style(`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    overflow: hidden;
    background: #f8fafc;
    font-family: 'Courier New', Courier, monospace;
  `);

  let sidebar = createDiv().id('sidebar').style(`
    width: 400px;
    padding: 24px;
    box-sizing: border-box;
    background: #ffffff;
    overflow-y: auto;
    height: 100%;
    border-right: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  `).parent(wrapper);

  createElement('h2', 'Pianificatore Attività').parent(sidebar).style(`
    margin: 0 0 24px 0;
    color: #0f172a;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    font-family: 'Courier New', Courier, monospace;
  `);

  let table = createElement('table').parent(sidebar).style(`
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    table-layout: fixed;
  `);

  table.html(`
    <thead>
      <tr style="background: #f1f5f9;">
        <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; font-family: 'Courier New', monospace;">Orario</th>
        <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; font-family: 'Courier New', monospace;">Colore</th>
        <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; font-family: 'Courier New', monospace;">Attività</th>
      </tr>
    </thead>
  `);

  let tbody = createElement('tbody').parent(table);
  canvasParent = createDiv().id('canvas-container').style(`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    overflow: hidden;
    background: #f8fafc;
  `).parent(wrapper);

  sidebar.elt.tbody = tbody;
}

function createActivityInputs() {
  let tbody = select('#sidebar').elt.tbody;

  for (let i = 0; i < 10; i++) {
    let tr = createElement('tr').parent(tbody).style('border-bottom: 1px solid #f1f5f9;');

    let tdTime = createElement('td').parent(tr).style('padding: 8px;');
    let inputTime = createInput('').attribute('placeholder', '09:00-11:00')
      .class('time')
      .style(`
        width: 100%;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 13px;
        background: white;
        color: #374151;
        font-family: 'Courier New', monospace;
        box-sizing: border-box;
      `).parent(tdTime);

    let tdColor = createElement('td').parent(tr).style('padding: 8px;');
    let colorPicker = createDiv().style('display: flex; flex-wrap: wrap; gap: 2px;').parent(tdColor);
    let selectedColor = createDiv().style('width: 100%; height: 34px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; position: relative;');
    selectedColor.parent(colorPicker);

    let dropdown = createDiv().style('position: absolute; top: 100%; left: 0; background: white; border: 1px solid #d1d5db; border-radius: 4px; display: none; z-index: 10; flex-wrap: wrap; gap: 4px; padding: 4px;');
    dropdown.parent(selectedColor);

    colors.forEach(c => {
      let swatch = createDiv().style(`width: 16px; height: 16px; background:${c}; border-radius: 2px; cursor: pointer; border: 1px solid #ccc;`);
      swatch.mousePressed(() => {
        selectedColor.style(`background:${c}; border: 1px solid #d1d5db; border-radius: 4px; height: 34px;`);
        selectedColor.elt.dataset.color = c;
        dropdown.style('display: none');
        justSelectedColor = true;
        setTimeout(() => justSelectedColor = false, 200);
      });
      swatch.parent(dropdown);
    });

    selectedColor.mousePressed(() => {
      if (justSelectedColor) return;
      let isVisible = dropdown.style('display') !== 'none';
      dropdown.style(isVisible ? 'display: none' : 'display: flex');
    });

    let tdLabel = createElement('td').parent(tr).style('padding: 8px;');
    let inputLabel = createInput('').attribute('placeholder', 'Studio')
      .class('label')
      .style(`
        width: 100%;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 13px;
        background: white;
        color: #374151;
        font-family: 'Courier New', monospace;
        box-sizing: border-box;
      `).parent(tdLabel);

    activityInputs.push({ time: inputTime, color: selectedColor, label: inputLabel });
  }
}

function updateCanvasSize() {
  let canvasW = windowWidth - 400;
  let canvasH = windowHeight;
  resizeCanvas(canvasW > 600 ? 600 : canvasW, canvasH);
}
