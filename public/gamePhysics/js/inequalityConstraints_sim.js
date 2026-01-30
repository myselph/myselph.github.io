function initInequalityConstraintsSim() {
    function setupChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'scatter',
            data: { datasets: [] },
            options: {
                scales: {
                    x: { min: -10, max: 10, grid: { display: true } },
                    y: { min: -2, max: 15, grid: { display: true } }
                },
                aspectRatio: 640 / 480,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                animation: false,
                parsing: false,
                responsive: true
            }
        });
    }

    function drawWorld(chart, world) {
        const datasets = [];
        for (let i = 0; i < world.bodies.length; i++) {
            const bodyVerts = world.bodies[i].getVerticesInWorldCoords();
            const data = bodyVerts.map(v => ({ x: v[0], y: v[1] }));
            data.push({ x: bodyVerts[0][0], y: bodyVerts[0][1] });

            datasets.push({
                label: 'Body ' + i,
                data: data,
                showLine: true,
                fill: true,
                pointRadius: 0,
                borderColor: 'black',
                borderWidth: 1,
                backgroundColor: 'rgba(0,0,0,0.1)'
            });
        }
        chart.data.datasets = datasets;
        chart.update('none');
    }

    // Stairs Demo
    (function () {
        const chart = setupChart('stairsCanvas');
        let simulationRunning = false;
        const startStopButton = document.querySelector('#stairs .start-button');
        const timeP = document.querySelector('#stairs .time');

        startStopButton.addEventListener('click', () => {
            if (!simulationRunning) {
                simulationRunning = true;
                startStopButton.textContent = "Stop";
            } else {
                simulationRunning = false;
                startStopButton.textContent = "Start";
                return;
            }

            const mass = parseFloat(document.querySelector('#stairs input[name=mass]').value) || 1;
            const x0 = parseFloat(document.querySelector('#stairs input[name=x0]').value) || 0;
            const y0 = parseFloat(document.querySelector('#stairs input[name=y0]').value) || 13;
            const vx0 = parseFloat(document.querySelector('#stairs input[name=vx0]').value) || 3;
            const vy0 = parseFloat(document.querySelector('#stairs input[name=vy0]').value) || 0;
            const vAng0 = parseFloat(document.querySelector('#stairs input[name=vAng0]').value) || -0.8;
            const theta0 = parseFloat(document.querySelector('#stairs input[name=theta0]').value) || 0;
            const tStop = parseFloat(document.querySelector('#stairs input[name=tStop]').value) || 3;

            const world = new World();
            const moi = mass / 12 * (4 + 4);
            const body = new Body([[1, -1], [-1, -1], [-1, 1], [1, 1]],
                [x0, y0], theta0, 1 / mass, 1 / moi, [vx0, vy0], vAng0);
            body.addForce([0, -mass * 9.81]);
            world.addBody(body);
            for (let i = -1; i < 16; i += 2) {
                const stairStep = new Body([[10, -1], [-10, -1], [-10, 1], [10, 1]],
                    [-3 - i, -2 + i], 0, 0, 0, [0, 0], 0);
                world.addBody(stairStep);
            }

            let t = 0;
            function step() {
                if (t >= tStop || !simulationRunning) {
                    startStopButton.textContent = "Start";
                    simulationRunning = false;
                    return;
                }
                world.step();
                drawWorld(chart, world);
                t += world.dt;
                timeP.textContent = t.toPrecision(3) + "s";
                setTimeout(step, world.dt * 1000);
            }
            step();
        });
    })();

    // Domino Demo
    (function () {
        const chart = setupChart('dominoCanvas');
        let simulationRunning = false;
        const startStopButton = document.querySelector('#domino .start-button');
        const timeP = document.querySelector('#domino .time');

        startStopButton.addEventListener('click', () => {
            if (!simulationRunning) {
                simulationRunning = true;
                startStopButton.textContent = "Stop";
            } else {
                simulationRunning = false;
                startStopButton.textContent = "Start";
                return;
            }

            const dominoSpacing = parseFloat(document.querySelector('#domino input[name=dominoSpacing]').value) || 1.125;
            const usrVAng0 = parseFloat(document.querySelector('#domino input[name=vAng0]').value) || -10;
            const tStop = parseFloat(document.querySelector('#domino input[name=tStop]').value) || 10;

            const world = new World();
            world.addBody(new Body([[10, -2], [-10, -2], [-10, 2], [10, 2]], [0, -2], 0, 0, 0, [0, 0], 0));
            world.addBody(new Body([[2, -10], [-2, -10], [-2, 10], [2, 10]], [-12, 10], 0, 0, 0, [0, 0], 0));
            world.addBody(new Body([[2, -10], [-2, -10], [-2, 10], [2, 10]], [12, 10], 0, 0, 0, [0, 0], 0));
            world.addBody(new Body([[10, -1], [-10, -1], [-10, 1], [10, 1]], [-5, 7.5], 0, 0, 0, [0, 0], 0));

            const W = 0.4, H = 4, mass = 1, moi = mass / 12 * (H * H + W * W);
            let first = true;
            for (let x = -7.5; x <= 5; x += dominoSpacing) {
                for (let y = 10.5; y > 0; y -= 8.5) {
                    const vAng0 = first ? usrVAng0 : 0;
                    const domino = new Body([[W / 2, -H / 2], [-W / 2, -H / 2], [-W / 2, H / 2], [W / 2, H / 2]], [x, y], 0, 1 / mass, 1 / moi, [0, 0], vAng0);
                    domino.addForce([0, -9.81 * mass]);
                    world.addBody(domino);
                    first = false;
                }
            }

            let t = 0;
            function step() {
                if (t >= tStop || !simulationRunning) {
                    startStopButton.textContent = "Start";
                    simulationRunning = false;
                    return;
                }
                world.step();
                drawWorld(chart, world);
                t += world.dt;
                timeP.textContent = t.toPrecision(3) + "s";
                setTimeout(step, world.dt * 1000);
            }
            step();
        });
    })();

    // Boxes Demo
    (function () {
        const chart = setupChart('boxesCanvas');
        let simulationRunning = false;
        const startStopButton = document.querySelector('#boxes .start-button');
        const timeP = document.querySelector('#boxes .time');

        startStopButton.addEventListener('click', () => {
            if (!simulationRunning) {
                simulationRunning = true;
                startStopButton.textContent = "Stop";
            } else {
                simulationRunning = false;
                startStopButton.textContent = "Start";
                return;
            }

            const tStop = parseFloat(document.querySelector('#boxes input[name=tStop]').value) || 6;

            const world = new World();
            const mass = 1;
            const groundPlane = new Body([[10, -2], [-10, -2], [-10, 2], [10, 2]], [0, -2], 0, 0, 0, [0, 0], 0);
            world.addBody(groundPlane);

            for (let x = -5; x <= 5; x += 2.5) {
                for (let y = 4; y <= 32; y += 2.5) {
                    const w = 1.3 + 0.5 * Math.random();
                    const moi = mass / 12 * (w * w + w * w);
                    const box = new Body([[w / 2, -w / 2], [-w / 2, -w / 2], [-w / 2, w / 2], [w / 2, w / 2]], [x, y], Math.random(), 1 / mass, 1 / moi, [0, 0], 0);
                    box.addForce([0, -9.81 * mass]);
                    world.addBody(box);
                }
            }

            let t = 0;
            function step() {
                if (t >= tStop || !simulationRunning) {
                    startStopButton.textContent = "Start";
                    simulationRunning = false;
                    return;
                }
                world.step();
                drawWorld(chart, world);
                t += world.dt;
                timeP.textContent = t.toPrecision(3) + "s";
                setTimeout(step, world.dt * 1000);
            }
            step();
        });
    })();
}

if (typeof Chart !== 'undefined') {
    initInequalityConstraintsSim();
} else {
    window.addEventListener('load', initInequalityConstraintsSim);
}
