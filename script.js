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

    // Generate Page 2
    generatePage2(divData, total, reguler, project, additional, regulerPct, projectPct, additionalPct, dateVal);

    document.getElementById('form-section').style.display = 'none';
    document.getElementById('report-section').style.display = 'block';
    switchPage('page1');
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
    // Round up max to nearest nice number for Y-axis
    const niceMax = Math.ceil(maxVal / 2) * 2; // always even number
    const leftPad = 35;
    const barAreaWidth = canvas.width - leftPad - 10;
    const barW = 55;
    const gap = (barAreaWidth - barW * divData.length) / (divData.length + 1);
    const chartH = 165;
    const topPad = 25;
    const bottomPad = 25;

    // Draw Y-axis grid lines & labels (integers only)
    const ySteps = Math.min(niceMax, 5);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#888';
    ctx.font = '600 10px Poppins';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= ySteps; i++) {
        const val = Math.round((niceMax / ySteps) * i);
        const yPos = topPad + chartH - (val / niceMax) * chartH;
        // Grid line
        ctx.beginPath();
        ctx.moveTo(leftPad, yPos);
        ctx.lineTo(canvas.width - 10, yPos);
        ctx.stroke();
        // Label
        ctx.fillText(val, leftPad - 5, yPos);
    }

    // Draw bars
    ctx.textAlign = 'center';
    divData.forEach((d, i) => {
        const x = leftPad + gap + i * (barW + gap);
        const totalAct = d.reguler + d.project + d.additional;
        const totalH = (totalAct / niceMax) * chartH;
        let y = topPad + chartH - totalH;

        // Reguler bar
        const rH = (d.reguler / niceMax) * chartH;
        if (rH > 0) { ctx.fillStyle = '#c0392b'; ctx.fillRect(x, y, barW, rH); y += rH; }
        // Project bar
        const pH = (d.project / niceMax) * chartH;
        if (pH > 0) { ctx.fillStyle = '#27ae60'; ctx.fillRect(x, y, barW, pH); y += pH; }
        // Additional bar
        const aH = (d.additional / niceMax) * chartH;
        if (aH > 0) { ctx.fillStyle = '#f39c12'; ctx.fillRect(x, y, barW, aH); }

        // Department name label
        ctx.fillStyle = '#333';
        ctx.font = '600 11px Poppins';
        ctx.fillText(d.name, x + barW / 2, topPad + chartH + bottomPad - 8);

        // Total value on top of bar
        if (totalAct > 0) {
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 12px Poppins';
            ctx.fillText(totalAct, x + barW / 2, topPad + chartH - totalH - 8);
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


// ===== PAGE 2: ACTIVITY LIST =====
let cachedDivData = [];

function generatePage2(divData, total, reguler, project, additional, regulerPct, projectPct, additionalPct, dateVal) {
    cachedDivData = divData;

    // Title
    document.getElementById('report-title-p2').textContent = `DAILY ACTIVITY GA \u2013 ${formatDate(dateVal)}`;

    // Activity Cards
    const output = document.getElementById('activity-list-output');
    output.innerHTML = '';

    divData.forEach(d => {
        if (d.activities.length === 0) return;
        const card = document.createElement('div');
        card.className = 'div-activity-card';

        let listHtml = d.activities.map(a => {
            const cls = a.category === 'REGULER' ? 'b-reguler' : a.category === 'PROJECT' ? 'b-project' : 'b-additional';
            return `<li><span>\u2022 ${a.name}</span><span class="badge-p2 ${cls}">${a.category}</span></li>`;
        }).join('');

        card.innerHTML = `
            <div class="div-activity-label" style="background:${d.bg}">
                <span class="dv-icon">${d.icon}</span>
                <span>${d.name}</span>
            </div>
            <div class="div-activity-content"><ul>${listHtml}</ul></div>
        `;
        output.appendChild(card);
    });

    // Stats
    document.getElementById('p2-total').textContent = total;
    document.getElementById('p2-reguler').textContent = reguler;
    document.getElementById('p2-project').textContent = project;
    document.getElementById('p2-additional').textContent = additional;
    document.getElementById('p2-reguler-pct').textContent = `\u25CF ${regulerPct}%`;
    document.getElementById('p2-project-pct').textContent = `\u25CF ${projectPct}%`;
    document.getElementById('p2-additional-pct').textContent = `\u25CF ${additionalPct}%`;

    // Pie Chart
    drawPieP2(reguler, project, additional, total);
}

function drawPieP2(reguler, project, additional, total) {
    const canvas = document.getElementById('pieChartP2');
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2, cy = canvas.height / 2, r = 110;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const segs = [
        { value: reguler, color: '#c0392b' },
        { value: project, color: '#27ae60' },
        { value: additional, color: '#f39c12' }
    ].filter(s => s.value > 0);

    let start = -Math.PI / 2;
    segs.forEach(seg => {
        const slice = (seg.value / total) * 2 * Math.PI;
        const end = start + slice;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        const mid = start + slice / 2;
        const pct = Math.round((seg.value / total) * 100);
        if (pct > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 15px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pct + '%', cx + Math.cos(mid) * r * 0.6, cy + Math.sin(mid) * r * 0.6);
        }
        start = end;
    });
}

// ===== PAGE SWITCHING =====
let currentPage = 'page1';

function switchPage(pageId) {
    document.getElementById('page1').style.display = pageId === 'page1' ? 'block' : 'none';
    document.getElementById('page2').style.display = pageId === 'page2' ? 'block' : 'none';
    currentPage = pageId;

    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (i === 0 && pageId === 'page1') || (i === 1 && pageId === 'page2'));
    });
}

// ===== SAVE CURRENT PAGE =====
function saveCurrentPage(format) {
    const containerId = currentPage === 'page1' ? 'report-container-page1' : 'report-container-page2';
    const el = document.getElementById(containerId);
    const btn = event.currentTarget;
    const orig = btn.innerHTML;
    btn.innerHTML = '\u23F3 Menyimpan...';
    btn.disabled = true;

    // Clone element ke offscreen agar tidak terganggu scroll/viewport
    const clone = el.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = '1400px';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    clone.style.zIndex = '-1';
    document.body.appendChild(clone);

    setTimeout(() => {
        html2canvas(clone, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        }).then(captured => {
            // Hapus clone
            document.body.removeChild(clone);

            const link = document.createElement('a');
            const suffix = currentPage === 'page1' ? '_Analysis' : '_ActivityList';
            const fn = `GA_Daily_Activity_${document.getElementById('activity-date').value}${suffix}`;
            if (format === 'png') {
                link.download = fn + '.png';
                link.href = captured.toDataURL('image/png');
            } else {
                link.download = fn + '.jpg';
                link.href = captured.toDataURL('image/jpeg', 0.95);
            }
            link.click();
            btn.innerHTML = orig; btn.disabled = false;
        }).catch(err => {
            document.body.removeChild(clone);
            alert('Gagal menyimpan. Coba lagi.');
            console.error(err);
            btn.innerHTML = orig; btn.disabled = false;
        });
    }, 300);
}
