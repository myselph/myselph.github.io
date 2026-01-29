function initEqualityConstraintsSim() {
    const ctx = document.getElementById('equalityConstraintsCanvas').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: []
        },
        options: {
            scales: {
                x: { min: -10, max: 10, grid: { display: true } },
                y: { min: -2, max: 15, grid: { display: true } }
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

        const tStop = parseFloat(document.querySelector('input[name=tStop]').value);

        /**** WORLD 1 - stairs ****/
        const world = new World();
        const ground = new Body([[10, -1], [0, -1], [-10, -1], [-10, 1], [10, 1]],
            [0, 15], 0, 0, 0, [0, 0], 0);
        world.addBody(ground);

        const links = [];
        const d = Math.sqrt(2) / 2;
        for (let i = 0; i <= 15; i++) {
            const link = new Body([[0, -0.5], [-0.1, -0.3], [-0.1, 0.3], [0, 0.5], [0.1, 0.3], [0.1, -0.3]],
                [d / 2 + i * d, 14 - d / 2 - i * d], Math.PI / 4, 5, 5, [0, 0], 0);
            link.addForce([0, -9.81]);
            world.addBody(link);
            links.push(link);
        }

        const joint0 = new Joint(ground, 1, links[0], 3);
        world.addJoint(joint0);

        for (let i = 0; i < links.length - 1; i++) {
            const joint = new Joint(links[i], 0, links[i + 1], 3);
            world.addJoint(joint);
        }
        links[links.length - 1].addForce([1, 0], 0);

        drawWorld(world);

        let t = 0;
        let nSteps = 0;
        let nStepsForDtAvg = Math.ceil(0.2 / world.dt);
        let t1 = new Date();
        let dtAvg = 0;

        function step() {
            if (nSteps == 0) {
                t1 = new Date();
            }

            if (t >= tStop || !simulationRunning) {
                startStopButton.textContent = "Start";
                simulationRunning = false;
                return;
            }

            world.step();
            drawWorld(world);

            t += world.dt;

            if (nSteps == nStepsForDtAvg) {
                const t2 = new Date();
                dtAvg = (t2 - t1) / nSteps;
                nSteps = 0;
            } else {
                nSteps++;
            }
            timeP.textContent = t.toPrecision(3) + "s (" + dtAvg.toPrecision(3) + "ms/frame)";

            setTimeout(step, world.dt * 1000);
        }

        step();
    });
}

if (typeof Chart !== 'undefined') {
    initEqualityConstraintsSim();
} else {
    window.addEventListener('load', initEqualityConstraintsSim);
}
