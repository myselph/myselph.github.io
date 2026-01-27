---
title: 'Line Plotting with Chart.js'
description: 'A demonstration of line plotting using Chart.js with random data, showing only lines and no points.'
pubDate: 'Jan 27 2026'
heroImage: '../../assets/blog-placeholder-3.jpg'
---

In this post, we'll look at how to create a simple line chart using Chart.js. We'll generate some random data and plot it as a continuous line without any individual data points.

<canvas id="randomLineChart" width="400" height="200"></canvas>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  (function() {
    const ctx = document.getElementById('randomLineChart').getContext('2d');
    
    // Generate random data
    const labels = Array.from({ length: 10 }, (_, i) => `Point ${i + 1}`);
    const data = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Random Data',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          pointRadius: 0, // No points
          pointHitRadius: 10,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  })();
</script>

This chart is generated dynamically using a script embedded directly in the Markdown file. We use `pointRadius: 0` to ensure that only the line is visible, fulfilling the requirement for "just lines, not points".
