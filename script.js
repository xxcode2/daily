document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('activity-date').value = new Date().toISOString().split('T')[0];
});

function addRow(containerId) {
    const container = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'activity-row';
    row.innerHTML = `<input type="text" placeholder="Nama aktivitas..." class="activity-input"><select class="category-select"><option value="REGULER">REGULER</option><option value="PROJECT">PROJECT</option><option value="ADDITIONAL">ADDITIONAL</option></select><button class="btn-remove" onclick="removeRow(this)">&#10005;</button>`;
    container.appendChild(row);
}

function removeRow(btn) {
    const row = btn.parentElement;
    if (row.parentElement.children.length > 1) row.remove();
}

const divisions = [
    { id: 'nrm-activities', name: 'NRM', prefix: 'nrm', icon: '&#127793;', bg: '#1a5c2e' },
    { id: 'cs-activities', name: 'CS', prefix: 'cs', icon: '&#128172;', bg: '#1a3a6b' },
    { id: 'utility-activities', name: 'UTILITY', prefix: 'utility', icon: '&#128295;', bg: '#b8860b' },
    { id: 'ts-activities', name: 'TS', prefix: 'ts', icon: '&#128225;', bg: '#4a0e8f' },
    { id: 'ga-activities', name: 'GA Internal', prefix: 'ga', icon: '&#9881;', bg: '#8b0000' }
];

function formatDate(dateStr) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const d = new Date(dateStr);
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function generateReport() {
    const dateVal = document.getElementById('activity-date').value;
    if (!dateVal) { alert('Pilih tanggal!'); return; }

    let allActivities = [];
    let divData = [];

    divisions.forEach(div => {
        const rows = document.getElementById(div.id).querySelectorAll('.activity-row');
        let acts = [];
        rows.forEach(row => {
            const name = row.querySelector('.activity-input').value.trim();
            const cat = row.querySelector('.category-select').value;
            if (name) { acts.push({ name, category: cat }); allActivities.push({ name, category: cat, dept: div.name }); }
        });

        // Get manual card inputs
        const label = document.getElementById(div.prefix + '-label').value.trim();
        const desc = document.getElementById(div.prefix + '-desc').value.trim();
        const tag = document.getElementById(div.prefix + '-tag').value.trim();

        divData.push({
            ...div, activities: acts,
            reguler: acts.filter(a => a.category === 'REGULER').length,
            project: acts.filter(a => a.category === 'PROJECT').length,
            additional: acts.filter(a => a.category === 'ADDITIONAL').length,
            cardLabel: label, cardDesc: desc, cardTag: tag
        });
    });

    if (allActivities.length === 0) { alert('Isi minimal 1 aktivitas!'); return; }

    const total = allActivities.length;
    const reguler = allActivities.filter(a => a.category === 'REGULER').length;
    const project = allActivities.filter(a => a.category === 'PROJECT').length;
    const additional = allActivities.filter(a => a.category === 'ADDITIONAL').length;
    const regulerPct = Math.round((reguler / total) * 100);
    const projectPct = Math.round((project / total) * 100);
    const additionalPct = 100 - regulerPct - projectPct;

    document.getElementById('report-title').textContent = `GA DAILY ACTIVITY ANALYSIS \u2013 ${formatDate(dateVal)}`;
    document.getElementById('legend-reguler').textContent = reguler;
    document.getElementById('legend-project').textContent = project;
    document.getElementById('legend-additional').textContent = additional;
    document.getElementById('summary-total').textContent = total;

    drawDonut(reguler, project, additional, total, regulerPct, projectPct, additionalPct);
    drawBarChart(divData);
    renderKeyNotes();
    generateDeptCards(divData);

    document.getElementById('form-section').style.display = 'none';
    document.getElementById('report-section').style.display = 'block';
}

function drawDonut(reguler, project, additional, total, rPct, pPct, aPct) {
    const canvas = document.getElementById('donutChart');
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const outerR = 120, innerR = 70;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const segments = [
        { value: reguler, color: '#c0392b', pct: rPct },
        { value: project, color: '#27ae60', pct: pPct },
        { value: additional, color: '#f39c12', pct: aPct }
    ].filter(s => s.value > 0);

    let startAngle = -Math.PI / 2;
    segments.forEach(seg => {
        const slice = (seg.value / total) * 2 * Math.PI;
        const end = startAngle + slice;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, end);
        ctx.arc(cx, cy, innerR, end, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        const mid = startAngle + slice / 2;
        const lx = cx + Math.cos(mid) * ((outerR + innerR) / 2);
        const ly = cy + Math.sin(mid) * ((outerR + innerR) / 2);
        if (seg.pct >= 5) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(seg.pct + '%', lx, ly);
        }
        startAngle = end;
    });

    ctx.fillStyle = '#333';
    ctx.font = '600 13px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('TOTAL:', cx, cy - 12);
    ctx.font = '900 32px Poppins';
    ctx.fillText(total, cx, cy + 18);
}

function drawBarChart(divData) {
    const canvas = document.getElementById('barChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maxVal = Math.max(...divData.map(d => d.reguler + d.project + d.additional), 1);
    const barW = 50, gap = (canvas.width - barW * divData.length) / (divData.length + 1);
    const chartH = 180, offsetY = 10;

    divData.forEach((d, i) => {
        const x = gap + i * (barW + gap);
        const totalH = ((d.reguler + d.project + d.additional) / maxVal) * chartH;
        let y = offsetY + chartH - totalH;

        const rH = (d.reguler / maxVal) * chartH;
        ctx.fillStyle = '#c0392b'; ctx.fillRect(x, y, barW, rH); y += rH;
        const pH = (d.project / maxVal) * chartH;
        ctx.fillStyle = '#27ae60'; ctx.fillRect(x, y, barW, pH); y += pH;
        const aH = (d.additional / maxVal) * chartH;
        ctx.fillStyle = '#f39c12'; ctx.fillRect(x, y, barW, aH);

        ctx.fillStyle = '#333'; ctx.font = '600 11px Poppins'; ctx.textAlign = 'center';
        ctx.fillText(d.name, x + barW / 2, offsetY + chartH + 15);

        const totalAct = d.reguler + d.project + d.additional;
        if (totalAct > 0) {
            ctx.fillStyle = '#555'; ctx.font = 'bold 11px Poppins';
            ctx.fillText(totalAct, x + barW / 2, offsetY + chartH - totalH - 5);
        }
    });
}

function renderKeyNotes() {
    const raw = document.getElementById('key-notes-input').value.trim();
    const list = document.getElementById('key-notes-list');
    list.innerHTML = '';

    if (!raw) {
        list.innerHTML = '<li>No analysis notes provided.</li>';
        return;
    }

    const lines = raw.split('\n').filter(l => l.trim());
    lines.forEach(line => {
        const li = document.createElement('li');
        // Bold text before colon
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
            li.innerHTML = `<strong>${line.substring(0, colonIdx + 1)}</strong>${line.substring(colonIdx + 1)}`;
        } else {
            li.textContent = line;
        }
        list.appendChild(li);
    });
}

function generateDeptCards(divData) {
    const container = document.getElementById('dept-cards');
    container.innerHTML = '';

    const tagColors = ['tag-yellow', 'tag-purple', 'tag-red', 'tag-blue', 'tag-green'];

    divData.forEach((d, i) => {
        if (d.activities.length === 0) return;
        const card = document.createElement('div');
        card.className = 'dept-card';

        const label = d.cardLabel || d.name.toUpperCase();
        const desc = d.cardDesc || `${d.activities.length} aktivitas hari ini`;
        const tag = d.cardTag;
        const tagClass = tagColors[i % tagColors.length];

        card.innerHTML = `
            <div class="dept-card-header" style="background:${d.bg}">
                <span>${d.icon}</span>
                <span>${d.name.toUpperCase()}</span>
            </div>
            <div class="dept-card-body">
                <strong>${label}</strong>
                <span class="dept-desc">Diringkas: ${desc}</span>
                ${tag ? `<span class="dept-card-tag ${tagClass}">${tag}</span>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

// Save as image
function saveAsImage(format) {
    const el = document.getElementById('report-container');
    const btn = event.currentTarget;
    const orig = btn.innerHTML;
    btn.innerHTML = '\u23F3 Menyimpan...';
    btn.disabled = true;

    const origStyle = el.style.cssText;
    el.style.width = '1400px';
    el.style.height = 'auto';
    el.style.overflow = 'visible';

    setTimeout(() => {
        html2canvas(el, {
            scale: 2, useCORS: true, backgroundColor: '#dfe6ed', logging: false,
            width: el.scrollWidth, height: el.scrollHeight,
            windowWidth: el.scrollWidth + 50, windowHeight: el.scrollHeight + 50
        }).then(captured => {
            el.style.cssText = origStyle;

            const ratio = 16 / 9;
            const srcW = captured.width, srcH = captured.height;
            let outW, outH;
            if (srcW / srcH >= ratio) { outW = srcW; outH = Math.round(srcW / ratio); }
            else { outH = srcH; outW = Math.round(srcH * ratio); }
            if (outW < 1920) { const s = 1920 / outW; outW = 1920; outH = Math.round(outH * s); }

            const final = document.createElement('canvas');
            final.width = outW; final.height = outH;
            const ctx = final.getContext('2d');
            ctx.fillStyle = '#dfe6ed';
            ctx.fillRect(0, 0, outW, outH);

            const scale = Math.min(outW / srcW, outH / srcH);
            const dW = srcW * scale, dH = srcH * scale;
            ctx.drawImage(captured, (outW - dW) / 2, (outH - dH) / 2, dW, dH);

            const link = document.createElement('a');
            const fn = `GA_Daily_Activity_${document.getElementById('activity-date').value}`;
            if (format === 'png') { link.download = fn + '.png'; link.href = final.toDataURL('image/png'); }
            else { link.download = fn + '.jpg'; link.href = final.toDataURL('image/jpeg', 0.95); }
            link.click();
            btn.innerHTML = orig; btn.disabled = false;
        }).catch(err => {
            el.style.cssText = origStyle;
            alert('Gagal menyimpan.'); console.error(err);
            btn.innerHTML = orig; btn.disabled = false;
        });
    }, 100);
}

function goBack() {
    document.getElementById('form-section').style.display = 'block';
    document.getElementById('report-section').style.display = 'none';
}
