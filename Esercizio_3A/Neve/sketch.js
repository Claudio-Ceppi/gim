let fiocchi;

function setup() {
	createCanvas(windowWidth, windowHeight);

	fiocchi = [];

	const f = "*✺✱✳✲✽❋☸⁕⁎﹡∗";

	

	for (let i = 0; i < 600; i++) {
		fiocchi[i] = {
			px: random(0, width),
			py: random(-100),
			vel: random(1, 4),
			chr: f[Math.floor(random(f.length))],
			colore: color(random(100, 180), random(20, 60), random(200, 255)),
			dim: random(10, 50)  // dimensione fissa assegnata qui
		}
	}
}

function draw() {
	background(0);
	textAlign(CENTER, CENTER);

	for (let i = 0; i < fiocchi.length; i++) {
		fiocchi[i].px = fiocchi[i].px + random(-1.5, 1.5);
		fiocchi[i].py = fiocchi[i].py + fiocchi[i].vel;

		if (fiocchi[i].py > height + 100) {
			fiocchi[i].py = -100;
		}

		fill(fiocchi[i].colore);
		textSize(fiocchi[i].dim); // usa la dimensione fissa
		text(fiocchi[i].chr, fiocchi[i].px, fiocchi[i].py);
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}
