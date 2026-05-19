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
    { id: 'ga-activities', name: 'GA\nInternal', icon: '&#9881;', bgClass: 'ga-bg' }
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

    // Collect all activities
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
            divisionData.push({
                ...div,
                activities: activities
            });
        }
    });

    if (allActivities.length === 0) {
        alert('Isi minimal 1 aktivitas!');
        return;
    }

    // Calculate stats
    const total = allActivities.length;
    const reguler = allActivities.filter(a => a.category === 'REGULER').length;
    const project = allActivities.filter(a => a.category === 'PROJECT').length;
    const additional = allActivities.filter(a => a.category === 'ADDITIONAL').length;

    const regulerPct = Math.round((reguler / total) * 100);
    const projectPct = Math.round((project / total) * 100);
    const additionalPct = Math.round((additional / total) * 100);

    // Update title
    document.getElementById('report-title').textContent = `DAILY ACTIVITY GA \u2013 ${formatDate(dateVal)}`;

    // Generate division cards
    const outputDiv = document.getElementById('divisions-output');
    outputDiv.innerHTML = '';

    divisionData.forEach(div => {
        const card = document.createElement('div');
        card.className = 'division-card';

        const bgColors = {
            'nrm-bg': 'linear-gradient(135deg, #1a5c2e, #2d8a4e)',
            'cs-bg': 'linear-gradient(135deg, #1a3a6b, #2a5aa8)',
            'utility-bg': 'linear-gradient(135deg, #b8860b, #d4a017)',
            'ts-bg': 'linear-gradient(135deg, #4a0e8f, #7b2ff7)',
            'ga-bg': 'linear-gradient(135deg, #8b0000, #c0392b)'
        };

        let activitiesHtml = div.activities.map(a => {
            const badgeClass = `badge-${a.category.toLowerCase()}`;
            return `<li><span>\u2022 ${a.name}</span><span class="badge ${badgeClass}">${a.category}</span></li>`;
        }).join('');

        card.innerHTML = `
            <div class="division-card-label" style="background: ${bgColors[div.bgClass]}">
                <span class="card-icon">${div.icon}</span>
                <span>${div.name.replace('\n', '<br>')}</span>
            </div>
            <div class="division-card-content">
                <ul>${activitiesHtml}</ul>
            </div>
        `;

        outputDiv.appendChild(card);
    });

    // Update stats
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-reguler').textContent = reguler;
    document.getElementById('stat-project').textContent = project;
    document.getElementById('stat-additional').textContent = additional;
    document.getElementById('stat-reguler-pct').textContent = `\u25CF ${regulerPct}%`;
    document.getElementById('stat-project-pct').textContent = `\u25CF ${projectPct}%`;
    document.getElementById('stat-additional-pct').textContent = `\u25CF ${additionalPct}%`;

    // Draw pie chart
    drawPieChart(reguler, project, additional, total);

    // Show report
    document.getElementById('form-section').style.display = 'none';
    document.getElementById('report-section').style.display = 'block';
}

// Draw pie chart on canvas
function drawPieChart(reguler, project, additional, total) {
    const canvas = document.getElementById('pieChart');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = [
        { value: reguler, color: '#c0392b', label: 'REGULER' },
        { value: project, color: '#27ae60', label: 'PROJECT' },
        { value: additional, color: '#f39c12', label: 'ADDITIONAL' }
    ].filter(d => d.value > 0);

    let startAngle = -Math.PI / 2;

    data.forEach(segment => {
        const sliceAngle = (segment.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();

        // Draw percentage label
        const midAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.65;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;
        const pct = Math.round((segment.value / total) * 100);

        if (pct > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${pct}%`, labelX, labelY);
        }

        startAngle = endAngle;
    });

    // Draw border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Save report as PNG or JPG in 16:9 ratio (1920x1080)
function saveAsImage(format) {
    const reportContainer = document.getElementById('report-container');
    
    // Show loading indicator
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Processing...';
    btn.disabled = true;

    html2canvas(reportContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: reportContainer.scrollWidth,
        height: reportContainer.scrollHeight
    }).then(capturedCanvas => {
        // Create 16:9 canvas (1920x1080)
        const outputWidth = 1920;
        const outputHeight = 1080;
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = outputWidth;
        finalCanvas.height = outputHeight;
        const ctx = finalCanvas.getContext('2d');

        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outputWidth, outputHeight);

        // Scale captured content to fit 16:9 while maintaining aspect ratio
        const srcWidth = capturedCanvas.width;
        const srcHeight = capturedCanvas.height;
        const scaleX = outputWidth / srcWidth;
        const scaleY = outputHeight / srcHeight;
        const scale = Math.min(scaleX, scaleY);

        const drawWidth = srcWidth * scale;
        const drawHeight = srcHeight * scale;
        const offsetX = (outputWidth - drawWidth) / 2;
        const offsetY = (outputHeight - drawHeight) / 2;

        ctx.drawImage(capturedCanvas, offsetX, offsetY, drawWidth, drawHeight);

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

        // Reset button
        btn.innerHTML = originalText;
        btn.disabled = false;
    }).catch(err => {
        alert('Gagal menyimpan gambar. Coba lagi.');
        console.error(err);
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

// Go back to form
function goBack() {
    document.getElementById('form-section').style.display = 'block';
    document.getElementById('report-section').style.display = 'none';
}
