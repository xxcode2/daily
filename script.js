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
    { id: 'nrm-activities', name: 'NRM', label: 'ADMIN & DOCUMENTS', desc: 'PO generation, document filing, transactions', icon: '&#127793;', bg: '#1a5c2e' },
    { id: 'cs-activities', name: 'CS', label: 'CLEANLINESS & WASTE', desc: 'Plant cleaning, waste disposal', icon: '&#128172;', bg: '#1a3a6b' },
    { id: 'utility-activities', name: 'UTILITY', label: 'FACILITIES & MAINTENANCE', desc: 'Panel checks, repairs', icon: '&#128295;', bg: '#b8860b' },
    { id: 'ts-activities', name: 'TS', label: 'INFRASTRUCTURE & PROJECTS', desc: 'Civil installations, layout painting', icon: '&#128225;', bg: '#4a0e8f' },
    { id: 'ga-activities', name: 'GA Internal', label: 'STRATEGIC PLANNING & ADMIN', desc: 'Catering, strategic proposals', icon: '&#9881;', bg: '#8b0000' }
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
        divData.push({ ...div, activities: acts, reguler: acts.filter(a=>a.category==='REGULER').length, project: acts.filter(a=>a.category==='PROJECT').length, additional: acts.filter(a=>a.category==='ADDITIONAL').length });
    });

    if (allActivities.length === 0) { alert('Isi minimal 1 aktivitas!'); return; }

    const total = allActivities.length;
    const reguler = allActivities.filter(a => a.category === 'REGULER').length;
    const project = allActivities.filter(a => a.category === 'PROJECT').length;
    const additional = allActivities.filter(a => a.category === 'ADDITIONAL').length;
    const regulerPct = Math.round((reguler/total)*100);
    const projectPct = Math.round((project/total)*100);
    const additionalPct = 100 - regulerPct - projectPct;

    // Title
    document.getElementById('report-title').textContent = `GA DAILY ACTIVITY ANALYSIS \u2013 ${formatDate(dateVal)}`;

    // Legend numbers
    document.getElementById('legend-reguler').textContent = reguler;
    document.getElementById('legend-project').textContent = project;
    document.getElementById('legend-additional').textContent = additional;
    document.getElementById('summary-total').textContent = total;

    // Donut Chart
    drawDonut(reguler, project, additional, total, regulerPct, projectPct, additionalPct);

    // Bar Chart
    drawBarChart(divData);

    // Key Notes
    generateKeyNotes(divData, regulerPct, total);

    // Department Cards
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

        // Percentage label
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

    // Center text
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

        // Reguler
        const rH = (d.reguler / maxVal) * chartH;
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(x, y, barW, rH);
        y += rH;

        // Project
        const pH = (d.project / maxVal) * chartH;
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x, y, barW, pH);
        y += pH;

        // Additional
        const aH = (d.additional / maxVal) * chartH;
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(x, y, barW, aH);

        // Label
        ctx.fillStyle = '#333';
        ctx.font = '600 11px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(d.name, x + barW / 2, offsetY + chartH + 15);

        // Value on top
        const totalAct = d.reguler + d.project + d.additional;
        if (totalAct > 0) {
            ctx.fillStyle = '#555';
            ctx.font = 'bold 11px Poppins';
            ctx.fillText(totalAct, x + barW / 2, offsetY + chartH - totalH - 5);
        }
    });
}

function generateKeyNotes(divData, regulerPct, total) {
    const notes = [];
    notes.push(`<li><strong>MAJOR FOCUS:</strong> Operational efficiency is dominated by Regular tasks (${regulerPct}%).</li>`);

    const projectDepts = divData.filter(d => d.project > 0).map(d => d.name);
    if (projectDepts.length > 0) {
        notes.push(`<li><strong>PROJECT INITIATIVES:</strong> Significant project push in ${projectDepts.join(' & ')}, focusing on new installations and strategic planning.</li>`);
    }

    const maxAdd = divData.reduce((a, b) => a.additional > b.additional ? a : b);
    if (maxAdd.additional > 0) {
        notes.push(`<li><strong>AD-HOC DEMAND:</strong> ${maxAdd.name} department handles the highest volume of Additional (Ad-hoc) requests.</li>`);
    }

    notes.push(`<li><strong>WORKFORCE BALANCE:</strong> Resource allocation needs review for higher Project and Additional tasks.</li>`);

    document.getElementById('key-notes-list').innerHTML = notes.join('');
}

function generateDeptCards(divData) {
    const container = document.getElementById('dept-cards');
    container.innerHTML = '';

    const tags = {
        'UTILITY': { text: 'HIGH AD-HOC DEMAND', class: 'tag-yellow' },
        'TS': { text: 'PROJECT DRIVE', class: 'tag-purple' },
        'GA Internal': { text: 'PROJECT INITIATIVES', class: 'tag-red' }
    };

    divData.forEach(d => {
        if (d.activities.length === 0) return;
        const tag = tags[d.name] || null;
        const card = document.createElement('div');
        card.className = 'dept-card';
        card.innerHTML = `
            <div class="dept-card-header" style="background:${d.bg}">
                <span>${d.icon}</span>
                <span>${d.name.toUpperCase()}</span>
            </div>
            <div class="dept-card-body">
                <strong>${d.label}</strong>
                Diringkas: ${d.desc}
                ${tag ? `<br><span class="dept-card-tag ${tag.class}">${tag.text}</span>` : ''}
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

    // Remove constraints
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
