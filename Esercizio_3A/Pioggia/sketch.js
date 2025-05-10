let angleX = 0;
let angleY = 0;
let angleZ = 0;

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL)
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight)
}

function draw() {
	background(100)


	rotateX(angleX + (-mouseY * 0.01))
	rotateY(angleY +( -mouseX * 0.01))
	rotateZ(angleZ);


	//box(50, 50, 50)

	let dimensione = 1000

	for (let i=0; i<1000; i++) {
		let gl = random(10, 150)
		let gx = random(-dimensione, dimensione)
		let gy = random(-dimensione, dimensione - gl)
		let gz = random(-dimensione, dimensione)

		

		let r = random(0);
    	let g = random(100, 255);
    	let b = random(100, 200);

		strokeWeight(random(5, 7))
		stroke(255, random(100, 255))
		stroke(r, g, b)
		line(gx, gy, gz,       gx, gy + gl, gz)

	}



}