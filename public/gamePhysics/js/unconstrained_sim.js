function initUnconstrainedSim() {
    const ctx = document.getElementById('unconstrainedMotionCanvas').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: []
        },
        options: {
            scales: {
                x: { min: -10, max: 10, grid: { display: true } },
                y: { min: 0, max: 15, grid: { display: true } }
            },
            aspectRatio: 640 / 480,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            animation: false,
            parsing: false,
            responsive: true
        }
    });

    function drawWorld(world) {
        const datasets = [];
        for (let i = 0; i < world.bodies.length; i++) {
            const bodyVerts = world.bodies[i].getVerticesInWorldCoords();
            const data = bodyVerts.map(v => ({ x: v[0], y: v[1] }));
            data.push({ x: bodyVerts[0][0], y: bodyVerts[0][1] }); // Close the loop

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

    let simulationRunning = false;
    const startStopButton = document.querySelector('[name=startStopButton]');
    const timeP = document.getElementById('time');

    startStopButton.addEventListener('click', () => {
        if (!simulationRunning) {
            simulationRunning = true;
            startStopButton.textContent = "Stop";
        } else {
            simulationRunning = false;
            startStopButton.textContent = "Start";
            return;
        }

        const world = new World();
        let mass = parseFloat(document.querySelector('input[name=mass]').value);
        if (mass < 0.001) mass = 0.001;

        const x0 = parseFloat(document.querySelector('input[name=x0]').value);
        const y0 = parseFloat(document.querySelector('input[name=y0]').value);
        const vx0 = parseFloat(document.querySelector('input[name=vx0]').value);
        const vy0 = parseFloat(document.querySelector('input[name=vy0]').value);
        const vAng0 = parseFloat(document.querySelector('input[name=vAng0]').value);
        const theta0 = parseFloat(document.querySelector('input[name=theta0]').value);
        const forceX = parseFloat(document.querySelector('input[name=forceX]').value);
        const forceY = parseFloat(document.querySelector('input[name=forceY]').value);
        const tStop = parseFloat(document.querySelector('input[name=tStop]').value);
        const forcePointValue = document.getElementById('forcePoint').value;

        let forcePointIndex = undefined;
        const options = document.querySelectorAll('#forcePoint option');
        options.forEach((opt, i) => {
            if (opt.textContent === forcePointValue) forcePointIndex = i;
        });
        forcePointIndex = (forcePointIndex === 0) ? undefined : (forcePointIndex - 1);

        const body = new Body([[1, -1], [-1, -1], [-1, 1], [1, 1]],
            [x0, y0], theta0, 1 / mass, 1, [vx0, vy0], vAng0);
        body.addForce([forceX, forceY], forcePointIndex);
        world.addBody(body);

        drawWorld(world);

        let t = 0;
        function step() {
            if (t >= tStop || !simulationRunning) {
                startStopButton.textContent = "Start";
                simulationRunning = false;
                return;
            }

            world.step();
            drawWorld(world);

            t += world.dt;
            timeP.textContent = t.toPrecision(3) + "s";

            setTimeout(step, world.dt * 1000);
        }

        step();
    });
}

// Check if Chart is already loaded, otherwise wait for it
if (typeof Chart !== 'undefined') {
    initUnconstrainedSim();
} else {
    window.addEventListener('load', initUnconstrainedSim);
}
