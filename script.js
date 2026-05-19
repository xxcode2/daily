// Set default date to today
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('activity-date').value = today;
});

// Add a new activity row
function addRow(containerId) {
    const container = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'activity-row';
    row.innerHTML = `
        <input type="text" placeholder="Nama aktivitas..." class="activity-input">
        <select class="category-select">
            <option value="REGULER">REGULER</option>
            <option value="PROJECT">PROJECT</option>
            <option value="ADDITIONAL">ADDITIONAL</option>
        </select>
        <button class="btn-remove" onclick="removeRow(this)">&#10005;</button>
    `;
    container.appendChild(row);
}

// Remove an activity row
function removeRow(btn) {
    const row = btn.parentElement;
    const container = row.parentElement;
    if (container.children.length > 1) {
        row.remove();
    }
}

// Division configuration
const divisions = [
    { id: 'nrm-activities', name: 'NRM', icon: '&#127793;', bgClass: 'nrm-bg' },
    { id: 'cs-activities', name: 'CS', icon: '&#128172;', bgClass: 'cs-bg' },
    { id: 'utility-activities', name: 'UTILITY', icon: '&#128295;', bgClass: 'utility-bg' },
    { id: 'ts-activities', name: 'TS', icon: '&#128225;', bgClass: 'ts-bg' },
    { id: 'ga-activities', name: 'GA Internal', icon: '&#9881;', bgClass: 'ga-bg' }
];

// Format date to Indonesian
function formatDate(dateStr) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const date = new Date(dateStr);
    const day = days[date.getDay()];
    const d = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}, ${d} ${month} ${year}`;
}

// Generate the report
function generateReport() {
    const dateVal = document.getElementById('activity-date').value;
    if (!dateVal) {
        alert('Pilih tanggal terlebih dahulu!');
        return;
    }

    let allActivities = [];
    let divisionData = [];

    divisions.forEach(div => {
        const container = document.getElementById(div.id);
        const rows = container.querySelectorAll('.activity-row');
        let activities = [];

        rows.forEach(row => {
            const input = row.querySelector('.activity-input').value.trim();
            const category = row.querySelector('.category-select').value;
            if (input) {
                activities.push({ name: input, category: category });
                allActivities.push({ name: input, category: category });
            }
        });

        if (activities.length > 0) {
            divisionData.push({ ...div, activities: activities });
        }
    });

    if (allActivities.length === 0) {
        alert('Isi minimal 1 aktivitas!');
        return;
    }

    const total = allActivities.length;
    const reguler = allActivities.filter(a => a.category === 'REGULER').length;
    const project = allActivities.filter(a => a.category === 'PROJECT').length;
    const additional = allActivities.filter(a => a.category === 'ADDITIONAL').length;

    const regulerPct = Math.round((reguler / total) * 100);
    const projectPct = Math.round((project / total) * 100);
    const additionalPct = Math.round((additional / total) * 100);

    document.getElementById('report-title').textContent = `DAILY ACTIVITY GA \u2013 ${formatDate(dateVal)}`;

    const outputDiv = document.getElementById('divisions-output');
    outputDiv.innerHTML = '';

    const bgColors = {
        'nrm-bg': 'linear-gradient(135deg, #1a5c2e, #2d8a4e)',
        'cs-bg': 'linear-gradient(135deg, #1a3a6b, #2a5aa8)',
        'utility-bg': 'linear-gradient(135deg, #b8860b, #d4a017)',
        'ts-bg': 'linear-gradient(135deg, #4a0e8f, #7b2ff7)',
        'ga-bg': 'linear-gradient(135deg, #8b0000, #c0392b)'
    };

    divisionData.forEach(div => {
        const card = document.createElement('div');
        card.className = 'division-card';

        let activitiesHtml = div.activities.map(a => {
            const badgeClass = `badge-${a.category.toLowerCase()}`;
            return `<li><span class="act-name">\u2022 ${a.name}</span><span class="badge ${badgeClass}">${a.category}</span></li>`;
        }).join('');

        card.innerHTML = `
            <div class="division-card-label" style="background: ${bgColors[div.bgClass]}">
                <span class="card-icon">${div.icon}</span>
                <span class="card-name">${div.name}</span>
            </div>
            <div class="division-card-content">
                <ul>${activitiesHtml}</ul>
            </div>
        `;
        outputDiv.appendChild(card);
    });

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-reguler').textContent = reguler;
    document.getElementById('stat-project').textContent = project;
    document.getElementById('stat-additional').textContent = additional;
    document.getElementById('stat-reguler-pct').textContent = `\u25CF ${regulerPct}%`;
    document.getElementById('stat-project-pct').textContent = `\u25CF ${projectPct}%`;
    document.getElementById('stat-additional-pct').textContent = `\u25CF ${additionalPct}%`;

    drawPieChart(reguler, project, additional, total);

    document.getElementById('form-section').style.display = 'none';
    document.getElementById('report-section').style.display = 'block';
}

// Draw pie chart
function drawPieChart(reguler, project, additional, total) {
    const canvas = document.getElementById('pieChart');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = [
        { value: reguler, color: '#c0392b' },
        { value: project, color: '#27ae60' },
        { value: additional, color: '#f39c12' }
    ].filter(d => d.value > 0);

    let startAngle = -Math.PI / 2;

    data.forEach(segment => {
        const sliceAngle = (segment.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();

        const midAngle = startAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(midAngle) * radius * 0.65;
        const labelY = centerY + Math.sin(midAngle) * radius * 0.65;
        const pct = Math.round((segment.value / total) * 100);

        if (pct > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Poppins, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${pct}%`, labelX, labelY);
        }

        startAngle = endAngle;
    });
}

// Save report as image 16:9 - responsive to content (no clipping)
function saveAsImage(format) {
    const reportContainer = document.getElementById('report-container');
    const reportBody = reportContainer.querySelector('.report-body');
    const reportLeft = reportContainer.querySelector('.report-left');
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = '\u23F3 Menyimpan...';
    btn.disabled = true;

    // Temporarily remove any overflow/height constraints so all content is visible
    const origContainerStyle = reportContainer.style.cssText;
    const origBodyStyle = reportBody.style.cssText;
    const origLeftStyle = reportLeft.style.cssText;

    reportContainer.style.width = '1280px';
    reportContainer.style.height = 'auto';
    reportContainer.style.minHeight = 'auto';
    reportContainer.style.overflow = 'visible';
    reportBody.style.overflow = 'visible';
    reportBody.style.height = 'auto';
    reportLeft.style.overflow = 'visible';
    reportLeft.style.height = 'auto';

    // Wait for reflow
    setTimeout(() => {
        html2canvas(reportContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: reportContainer.scrollWidth,
            height: reportContainer.scrollHeight,
            windowWidth: reportContainer.scrollWidth + 100,
            windowHeight: reportContainer.scrollHeight + 100
        }).then(capturedCanvas => {
            // Restore original styles
            reportContainer.style.cssText = origContainerStyle;
            reportBody.style.cssText = origBodyStyle;
            reportLeft.style.cssText = origLeftStyle;
            // Tentukan ukuran output 16:9
            const ratio = 16 / 9;
            const srcW = capturedCanvas.width;
            const srcH = capturedCanvas.height;
            const srcRatio = srcW / srcH;

            let outputWidth, outputHeight;

            if (srcRatio >= ratio) {
                outputWidth = srcW;
                outputHeight = Math.round(srcW / ratio);
            } else {
                outputHeight = srcH;
                outputWidth = Math.round(srcH * ratio);
            }

            // Minimum 1920x1080
            if (outputWidth < 1920) {
                const upscale = 1920 / outputWidth;
                outputWidth = 1920;
                outputHeight = Math.round(outputHeight * upscale);
            }

            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = outputWidth;
            finalCanvas.height = outputHeight;
            const ctx = finalCanvas.getContext('2d');

            // Background putih
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outputWidth, outputHeight);

            // Scale konten agar muat di canvas 16:9
            const scale = Math.min(outputWidth / srcW, outputHeight / srcH);
            const drawW = srcW * scale;
            const drawH = srcH * scale;
            const offsetX = (outputWidth - drawW) / 2;
            const offsetY = (outputHeight - drawH) / 2;

            ctx.drawImage(capturedCanvas, offsetX, offsetY, drawW, drawH);

            // Download
            const link = document.createElement('a');
            const dateVal = document.getElementById('activity-date').value;
            const fileName = `Daily_Activity_GA_${dateVal}`;

            if (format === 'png') {
                link.download = `${fileName}.png`;
                link.href = finalCanvas.toDataURL('image/png');
            } else {
                link.download = `${fileName}.jpg`;
                link.href = finalCanvas.toDataURL('image/jpeg', 0.95);
            }

            link.click();
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            // Restore original styles on error too
            reportContainer.style.cssText = origContainerStyle;
            reportBody.style.cssText = origBodyStyle;
            reportLeft.style.cssText = origLeftStyle;
            alert('Gagal menyimpan gambar. Coba lagi.');
            console.error(err);
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    }, 100);
}

// Go back to form
function goBack() {
    document.getElementById('form-section').style.display = 'block';
    document.getElementById('report-section').style.display = 'none';
}
