document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('activity-date').value = new Date().toISOString().split('T')[0];
});

function addRow(containerId) {
    const container = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'activity-row';
    row.innerHTML = `<input type="text" class="activity-input" placeholder="Aktivitas..."><select class="category-select"><option value="REGULER">REGULER</option><option value="PROJECT">PROJECT</option><option value="ADDITIONAL">ADDITIONAL</option></select><button class="btn-remove" onclick="removeRow(this)">✕</button>`;
    container.appendChild(row);
}

function removeRow(btn) {
    const row = btn.parentElement;
    if (row.parentElement.children.length > 1) row.remove();
}

const divisions = [
    { id: 'nrm-activities', name: 'NRM', icon: '🪣' },
    { id: 'cs-activities', name: 'CLEANING SERVICE', icon: '🪣' },
    { id: 'ts-activities', name: 'TECHNICAL SUPPORT / WORKSHOP', icon: '🔧' },
    { id: 'utility-activities', name: 'UTILITY', icon: '🏗️' },
    { id: 'ga-activities', name: 'GA Internal', icon: '📋' }
];

function formatDateID(dateStr) {
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const d = new Date(dateStr);
    return { full: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`, day: days[d.getDay()] };
}

function generateReport() {
    const dateVal = document.getElementById('activity-date').value;
    const picName = document.getElementById('pic-name').value.trim() || 'GA Team';
    if (!dateVal) { alert('Pilih tanggal!'); return; }

    let allActivities = [];
    let divData = [];

    divisions.forEach(div => {
        const rows = document.getElementById(div.id).querySelectorAll('.activity-row');
        let acts = [];
        rows.forEach(row => {
            const name = row.querySelector('.activity-input').value.trim();
            const cat = row.querySelector('.category-select').value;
            if (name) acts.push({ name, category: cat });
        });
        allActivities.push(...acts.map(a => ({ ...a, dept: div.name })));
        divData.push({ ...div, activities: acts });
    });

    if (allActivities.length === 0) { alert('Isi minimal 1 aktivitas!'); return; }

    const total = allActivities.length;
    const reguler = allActivities.filter(a => a.category === 'REGULER').length;
    const project = allActivities.filter(a => a.category === 'PROJECT').length;
    const additional = allActivities.filter(a => a.category === 'ADDITIONAL').length;

    const dateInfo = formatDateID(dateVal);

    // Header
    document.getElementById('report-date').textContent = dateInfo.full;
    document.getElementById('report-pic').textContent = picName;

    // Left Column: Division Activities
    const output = document.getElementById('division-activities-output');
    output.innerHTML = '';
    divData.forEach(d => {
        if (d.activities.length === 0) return;
        const card = document.createElement('div');
        card.className = 'div-activity-card';
        const listHtml = d.activities.map(a => {
            const cls = a.category === 'REGULER' ? 'badge-reguler' : a.category === 'PROJECT' ? 'badge-project' : 'badge-additional';
            return `<li><span>• ${a.name}</span><span class="badge ${cls}">${a.category}</span></li>`;
        }).join('');
        card.innerHTML = `<div class="div-label"><span class="div-icon">${d.icon}</span><span class="div-name">${d.name}</span></div><div class="div-content"><ul>${listHtml}</ul></div>`;
        output.appendChild(card);
    });

    // Right Column: Key Achievement
    const achInput = document.getElementById('key-achievement-input').value.trim();
    const achGrid = document.getElementById('achievement-grid');
    const achIcons = ['📋', '✅', '📈'];
    const defaultAch = ['Seluruh kegiatan berjalan sesuai rencana dengan fokus pada kebersihan, perawatan, dan administrasi.', 'Dukungan antar tim optimal dalam menjaga operasional plant tetap lancar dan terkendali.', 'Progres project berjalan sesuai target, dengan beberapa tambahan aktivitas pendukung.'];
    const achLines = achInput ? achInput.split('\n').filter(l => l.trim()) : defaultAch;
    achGrid.innerHTML = achLines.slice(0, 3).map((line, i) => `<div class="achievement-item"><span class="ach-icon">${achIcons[i] || '✅'}</span><p>${line.trim()}</p></div>`).join('');

    // Donut Chart
    drawDonut(reguler, project, additional, total);

    // Donut Legend
    const legend = document.getElementById('donut-legend');
    const rPct = Math.round((reguler / total) * 100);
    const pPct = Math.round((project / total) * 100);
    const aPct = 100 - rPct - pPct;
    legend.innerHTML = `
        <div class="legend-row"><span class="dot dot-blue"></span> Regular (${reguler}) &nbsp; ${rPct}%</div>
        <div class="legend-row"><span class="dot dot-gold"></span> Project (${project}) &nbsp; ${pPct}%</div>
        <div class="legend-row"><span class="dot dot-teal"></span> Additional (${additional}) &nbsp; ${aPct}%</div>
        <div class="legend-total">TOTAL &nbsp;&nbsp;&nbsp; 100%</div>
    `;

    // Additional Highlight Badge
    document.getElementById('highlight-badge').textContent = `${additional} AKTIVITAS ✓`;

    // Next Action
    const nextInput = document.getElementById('next-action-input').value.trim();
    const nextList = document.getElementById('next-action-list');
    const defaultNext = ['Melanjutkan penyelesaian task reguler & project sesuai timeline.', 'Monitoring progres dan pelaporan hasil kegiatan harian.'];
    const nextLines = nextInput ? nextInput.split('\n').filter(l => l.trim()) : defaultNext;
    nextList.innerHTML = nextLines.map(l => `<li>${l.trim()}</li>`).join('');

    // Next Action Meta
    document.getElementById('meta-report-day').textContent = `${dateInfo.day},`;
    document.getElementById('meta-report-date').textContent = dateInfo.full;

    // Show report
    document.getElementById('form-section').style.display = 'none';
    document.getElementById('report-section').style.display = 'block';
}

function drawDonut(reguler, project, additional, total) {
    const canvas = document.getElementById('donutChart');
    const ctx = canvas.getContext('2d');
    const cx = 100, cy = 100, outerR = 90, innerR = 55;
    ctx.clearRect(0, 0, 200, 200);

    const segments = [
        { value: reguler, color: '#1B3A5C' },
        { value: project, color: '#D4A017' },
        { value: additional, color: '#2E86AB' }
    ].filter(s => s.value > 0);

    let startAngle = -Math.PI / 2;
    segments.forEach(seg => {
        const slice = (seg.value / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
        ctx.arc(cx, cy, innerR, startAngle + slice, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        // Percentage label
        const mid = startAngle + slice / 2;
        const pct = Math.round((seg.value / total) * 100);
        if (pct >= 5) {
            const lx = cx + Math.cos(mid) * ((outerR + innerR) / 2);
            const ly = cy + Math.sin(mid) * ((outerR + innerR) / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pct + '%', lx, ly);
        }
        startAngle += slice;
    });

    // Center text
    ctx.fillStyle = '#1B3A5C';
    ctx.font = 'bold 24px Poppins';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 5);
    ctx.font = '600 10px Poppins';
    ctx.fillText('Aktivitas', cx, cy + 14);
}

function goBack() {
    document.getElementById('form-section').style.display = 'block';
    document.getElementById('report-section').style.display = 'none';
}

function saveReport(format) {
    const el = document.getElementById('report-container');
    html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#f0f4f8' }).then(canvas => {
        const link = document.createElement('a');
        const dateVal = document.getElementById('activity-date').value;
        link.download = `Daily_Activity_Report_${dateVal}.${format}`;
        link.href = format === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.95);
        link.click();
    });
}
