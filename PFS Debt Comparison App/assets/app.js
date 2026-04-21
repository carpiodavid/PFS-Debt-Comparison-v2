/* ============================================================
   Providence Financial Solutions — v2 app logic
   ============================================================ */

(function () {
  'use strict';

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const debtSlider = $('debtSlider');
  const aprSlider = $('aprSlider');
  const debtInput = $('debtInput');
  const aprInput = $('aprInput');
  const debtValue = $('debtValue');
  const aprValue = $('aprValue');
  const minPayment = $('minPayment');
  const payoffTime = $('payoffTime');
  const totalPaid = $('totalPaid');
  const interestPaid = $('interestPaid');
  const settlementMonthly = $('settlementMonthly');
  const settlementTimeline = $('settlementTimeline');
  const settlementPrincipal = $('settlementPrincipal');
  const settlementFees = $('settlementFees');
  const settlementOverrideToggle = $('settlementOverrideToggle');
  const settlementOverrideFields = $('settlementOverrideFields');
  const settlementMonthlyInput = $('settlementMonthlyInput');
  const settlementMonthsInput = $('settlementMonthsInput');
  const legalMonthly = $('legalMonthly');
  const legalTier = $('legalTier');
  const legalTotal = $('legalTotal');
  const legalFinish = $('legalFinish');
  const clientName = $('clientName');
  const repName = $('repName');
  const scenarioNotes = $('scenarioNotes');
  const summaryText = $('summaryText');
  const amortRows = $('amortRows');
  const toastEl = $('toast');
  const chartBars = $('chartBars');
  const chartDebtRef = $('chartDebtRef');
  const chartAprRef = $('chartAprRef');
  const chartCallout = $('chartCallout');

  // ---------- Pricing tiers (preserved) ----------
  const legalPricing = [
    { upTo: 15000, payment: 250 }, { upTo: 17500, payment: 275 }, { upTo: 20000, payment: 300 },
    { upTo: 22500, payment: 325 }, { upTo: 25000, payment: 350 }, { upTo: 27500, payment: 375 },
    { upTo: 30000, payment: 400 }, { upTo: 32500, payment: 425 }, { upTo: 35000, payment: 450 },
    { upTo: 37500, payment: 475 }, { upTo: 40000, payment: 500 }, { upTo: 42500, payment: 525 },
    { upTo: 45000, payment: 550 }, { upTo: 47500, payment: 575 }, { upTo: 50000, payment: 600 },
    { upTo: 52500, payment: 625 }, { upTo: 55000, payment: 650 }, { upTo: 57500, payment: 675 },
    { upTo: 60000, payment: 700 }, { upTo: 62500, payment: 725 }, { upTo: 65000, payment: 750 },
    { upTo: 67500, payment: 775 }, { upTo: 70000, payment: 800 }, { upTo: 72500, payment: 825 },
    { upTo: 75000, payment: 850 }, { upTo: 77500, payment: 875 }, { upTo: 80000, payment: 900 },
    { upTo: 82500, payment: 925 }, { upTo: 85000, payment: 950 }, { upTo: 87500, payment: 975 },
    { upTo: 90000, payment: 1000 }, { upTo: 92500, payment: 1025 }, { upTo: 95000, payment: 1050 },
    { upTo: 97500, payment: 1075 }, { upTo: 100000, payment: 1100 }, { upTo: 102500, payment: 1125 },
    { upTo: 105000, payment: 1150 }, { upTo: 107500, payment: 1175 }, { upTo: 110000, payment: 1200 },
    { upTo: 112500, payment: 1225 }, { upTo: 115000, payment: 1250 }, { upTo: 117500, payment: 1275 },
    { upTo: 120000, payment: 1300 }, { upTo: 122500, payment: 1325 }, { upTo: 125000, payment: 1350 },
    { upTo: 127500, payment: 1375 }, { upTo: 130000, payment: 1400 }, { upTo: 132500, payment: 1425 },
    { upTo: 135000, payment: 1450 }, { upTo: 137500, payment: 1475 }, { upTo: 140000, payment: 1500 },
    { upTo: 142500, payment: 1525 }, { upTo: 145000, payment: 1550 }, { upTo: 147500, payment: 1575 },
    { upTo: 150000, payment: 1600 }
  ];

  // ---------- Formatting ----------
  const fmtMoney = (n, digits = 0) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: digits, maximumFractionDigits: digits
  }).format(n);
  const fmtCompact = (n) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return fmtMoney(n);
  };
  function fmtYears(months) {
    const y = Math.floor(months / 12); const rem = months % 12;
    if (y <= 0) return `${rem} mo`;
    if (rem === 0) return `${y}y`;
    return `${y}y ${rem}m`;
  }
  function finishDateFromMonths(months) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // ---------- Calculations (preserved) ----------
  function calcCreditCard(debt, apr) {
    let balance = debt, month = 0, total = 0, firstMin = 0;
    const monthlyRate = apr / 100 / 12;
    const preview = [];
    while (balance > 0.01 && month < 1200) {
      const interest = balance * monthlyRate;
      let payment = Math.max(balance * 0.01 + interest, 35);
      if (payment > balance + interest) payment = balance + interest;
      const principalPaid = payment - interest;
      balance = Math.max(0, balance - principalPaid);
      month += 1;
      total += payment;
      if (month === 1) firstMin = payment;
      if (preview.length < 12) preview.push({ month, payment, interest, balance });
    }
    return {
      firstMin, months: month, totalPaid: total,
      interestPaid: Math.max(0, total - debt), preview,
      capped: month >= 1200 && balance > 0.01
    };
  }
  function calcSettlement(debt) {
    const months = 55;
    const settledPrincipal = debt * 0.50;
    const fees = debt * 0.20;
    const totalProgram = settledPrincipal + fees;
    const monthly = totalProgram / months;
    const manual = settlementOverrideToggle && settlementOverrideToggle.checked;
    if (manual) {
      const m = Math.max(0, Number(settlementMonthlyInput.value || 0));
      const n = Math.max(1, Number(settlementMonthsInput.value || 0));
      if (m > 0 && n > 0) return { settledPrincipal, fees, totalProgram: m * n, months: n, monthly: m, mode: 'Manual quote' };
    }
    return { settledPrincipal, fees, totalProgram, months, monthly, mode: 'Fixed avg' };
  }
  function calcLegal(debt) {
    const months = 24;
    if (debt >= 130000) {
      const monthly = 1500;
      return { monthly, months, total: monthly * months, tierLabel: `${fmtMoney(130000)}+ cap` };
    }
    const tier = legalPricing.find(item => debt <= item.upTo) || legalPricing[legalPricing.length - 1];
    return { monthly: tier.payment, months, total: tier.payment * months, tierLabel: `Up to ${fmtMoney(tier.upTo)}` };
  }
  function getState() {
    const debt = Math.max(0, Number(debtSlider.value));
    const apr = Math.max(0, Number(aprSlider.value));
    const cc = calcCreditCard(debt, apr);
    const ds = calcSettlement(debt);
    const ld = calcLegal(debt);
    return { debt, apr, cc, ds, ld };
  }

  // ---------- Count-up tween ----------
  const tweens = new WeakMap();
  function tween(el, to, format) {
    const prev = tweens.get(el) || { raf: 0, val: to };
    cancelAnimationFrame(prev.raf);
    const from = prev.val;
    const dur = 420;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = from + (to - from) * eased;
      el.textContent = format(v);
      if (k < 1) prev.raf = requestAnimationFrame(step);
      else prev.val = to;
    };
    prev.raf = requestAnimationFrame(step);
    prev.val = from;
    tweens.set(el, prev);
  }

  // ---------- Slider fill CSS var ----------
  function setSliderFill(slider) {
    const min = Number(slider.min), max = Number(slider.max), v = Number(slider.value);
    const pct = ((v - min) / (max - min)) * 100;
    slider.style.setProperty('--fill', pct + '%');
  }

  // ---------- Chart ----------
  let chartMetric = 'total'; // total | monthly | months

  function drawChart(state) {
    const { debt, apr, cc, ds, ld } = state;
    chartDebtRef.textContent = fmtMoney(debt);
    chartAprRef.textContent = apr.toFixed(2) + '%';

    // Values per metric
    let values, fmt, label;
    if (chartMetric === 'total') {
      values = [cc.totalPaid, ds.totalProgram, ld.total];
      fmt = (v) => fmtMoney(v);
      label = 'Total paid';
    } else if (chartMetric === 'monthly') {
      values = [cc.firstMin, ds.monthly, ld.monthly];
      fmt = (v) => fmtMoney(v) + '/mo';
      label = 'Monthly payment';
    } else {
      const ccMonths = cc.capped ? 1200 : cc.months;
      values = [ccMonths, ds.months, ld.months];
      fmt = (v) => v >= 1200 ? '100+ yrs' : fmtYears(Math.round(v));
      label = 'Timeline';
    }

    const max = Math.max(...values) || 1;
    const labels = ['Credit card minimums', 'Debt settlement', 'Legal Debt Resolution'];
    const subs = [
      cc.capped ? '100+ years trapped' : `Years: ${fmtYears(cc.months)}`,
      `Months: ${ds.months}`,
      `Months: 24`
    ];
    const featured = [false, false, true];

    chartBars.innerHTML = '';
    const maxBarH = 260; // px
    values.forEach((v, i) => {
      const col = document.createElement('div');
      col.className = 'bar-col' + (featured[i] ? ' featured' : '');

      const valueEl = document.createElement('div');
      valueEl.className = 'bar-value';
      valueEl.textContent = fmt(v);

      const bar = document.createElement('div');
      bar.className = 'bar';
      const h = Math.max(8, (v / max) * maxBarH);
      bar.style.height = h + 'px';
      bar.style.animationDelay = (i * 80) + 'ms';

      const labelEl = document.createElement('div');
      labelEl.className = 'bar-label';
      labelEl.textContent = labels[i];

      const subEl = document.createElement('div');
      subEl.className = 'bar-sub';
      subEl.textContent = subs[i];

      col.appendChild(valueEl);
      col.appendChild(bar);
      col.appendChild(labelEl);
      col.appendChild(subEl);
      chartBars.appendChild(col);
    });

    // Callout
    const savedVsCards = Math.max(0, cc.totalPaid - ld.total);
    const savedVsSettlement = Math.max(0, ds.totalProgram - ld.total);
    const pct = cc.totalPaid > 0 ? Math.round((savedVsCards / cc.totalPaid) * 100) : 0;
    chartCallout.innerHTML = `Legal Debt Resolution saves the client <strong>${fmtMoney(savedVsCards)}</strong> versus minimums — a <strong>${pct}% reduction</strong> with a defined finish in ${finishDateFromMonths(24)}.`;
  }

  // ---------- Render ----------
  function render() {
    const state = getState();
    const { debt, apr, cc, ds, ld } = state;

    setSliderFill(debtSlider); setSliderFill(aprSlider);

    debtValue.textContent = fmtMoney(debt);
    aprValue.textContent = apr.toFixed(2) + '%';

    if (document.activeElement !== debtInput) debtInput.value = debt;
    if (document.activeElement !== aprInput) aprInput.value = apr.toFixed(2);

    tween(minPayment, cc.firstMin, fmtMoney);
    payoffTime.textContent = cc.capped ? '100+ yrs' : fmtYears(cc.months);
    tween(totalPaid, cc.totalPaid, fmtMoney);
    tween(interestPaid, cc.interestPaid, fmtMoney);

    tween(settlementMonthly, ds.monthly, fmtMoney);
    settlementTimeline.textContent = `${ds.months} mo`;
    tween(settlementPrincipal, ds.totalProgram, fmtMoney);
    settlementFees.textContent = ds.mode;
    settlementOverrideFields.hidden = !settlementOverrideToggle.checked;

    tween(legalMonthly, ld.monthly, fmtMoney);
    legalTier.textContent = ld.tierLabel;
    tween(legalTotal, ld.total, fmtMoney);
    legalFinish.textContent = finishDateFromMonths(24);

    const saved = Math.max(0, cc.totalPaid - ld.total);
    summaryText.textContent =
      `On ${fmtMoney(debt)} at ${apr.toFixed(2)}% APR, credit card minimums start at ${fmtMoney(cc.firstMin)}/month and drag on for ${cc.capped ? '100+ years' : fmtYears(cc.months)}. ` +
      `Debt settlement runs ${fmtMoney(ds.monthly)}/mo for ${ds.months} months (${ds.mode === 'Manual quote' ? 'manual competitor quote' : 'fixed average'}). ` +
      `Providence's Legal Debt Resolution sets ${fmtMoney(ld.monthly)}/month for 24 months${debt >= 130000 ? ' with the $1,500 cap applied' : ''} — finishing in ${finishDateFromMonths(24)} and saving roughly ${fmtMoney(saved)} versus minimums.`;

    amortRows.innerHTML = cc.preview.map(r =>
      `<tr><td>${r.month}</td><td>${fmtMoney(r.payment, 2)}</td><td>${fmtMoney(r.interest, 2)}</td><td>${fmtMoney(r.balance, 2)}</td></tr>`
    ).join('');

    drawChart(state);
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  // ---------- PDF: one-pager portrait close piece ----------
  async function exportPdf() {
    const { jsPDF } = window.jspdf;
    const state = getState();
    const { debt, apr, cc, ds, ld } = state;
    const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
    const W = 612, H = 792; // portrait letter
    const M = 40;
    const client = (clientName.value || '').trim() || 'Client';
    const rep = (repName.value || '').trim();
    const notes = (scenarioNotes.value || '').trim();

    // Palette — print-optimized
    const INK = [18, 18, 20];
    const INK_2 = [48, 48, 52];
    const MUTE = [120, 115, 105];
    const FAINT = [170, 165, 155];
    const HAIR = [224, 218, 204];
    const PAPER = [250, 246, 238];
    const PAPER_2 = [244, 239, 225];
    const GOLD = [176, 138, 55];
    const GOLD_DEEP = [130, 100, 40];

    const wrap = (t, w) => doc.splitTextToSize(t, w);
    const rgb = (c) => doc.setTextColor(c[0], c[1], c[2]);
    const fill = (c) => doc.setFillColor(c[0], c[1], c[2]);
    const stroke = (c) => doc.setDrawColor(c[0], c[1], c[2]);

    // White bg
    fill([255, 255, 255]); doc.rect(0, 0, W, H, 'F');
    // Top gold hairline
    fill(GOLD); doc.rect(0, 0, W, 3, 'F');

    // -------- Masthead --------
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); rgb(GOLD);
    doc.text('PROVIDENCE FINANCIAL SOLUTIONS', M, 26);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); rgb(MUTE);
    doc.text('Debt Relief Comparison · Client Summary', M, 39);

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    doc.text(`Prepared ${today}${rep ? ' · ' + rep : ''}`, W - M, 26, { align: 'right' });
    doc.text(`For ${client}`, W - M, 39, { align: 'right' });

    stroke(HAIR); doc.setLineWidth(0.5);
    doc.line(M, 50, W - M, 50);

    // -------- Headline --------
    doc.setFont('times', 'normal'); doc.setFontSize(26); rgb(INK);
    const headline = wrap(`A clearer path out of ${fmtMoney(debt)} of debt.`, W - M * 2);
    doc.text(headline, M, 84);
    const headEnd = 84 + headline.length * 28;

    doc.setFont('times', 'italic'); doc.setFontSize(14); rgb(GOLD_DEEP);
    doc.text(`${fmtMoney(ld.monthly)} / month · 24 months · done by ${finishDateFromMonths(24)}`, M, headEnd + 4);

    // -------- Hero savings band --------
    const savedVsCards = Math.max(0, cc.totalPaid - ld.total);
    const pctSave = cc.totalPaid > 0 ? Math.round((savedVsCards / cc.totalPaid) * 100) : 0;
    const bandY = headEnd + 24;
    const bandH = 78;
    fill(PAPER); stroke(HAIR); doc.setLineWidth(0.8);
    doc.roundedRect(M, bandY, W - M * 2, bandH, 8, 8, 'FD');
    fill(GOLD); doc.rect(M, bandY, 3, bandH, 'F');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); rgb(MUTE);
    doc.text('ESTIMATED SAVINGS VS MINIMUMS', M + 18, bandY + 20);
    doc.setFont('times', 'normal'); doc.setFontSize(38); rgb(INK);
    doc.text(fmtMoney(savedVsCards), M + 18, bandY + 56);

    // right side of band: subtext
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); rgb(MUTE);
    doc.text('FINISHED SOONER', W - M - 18, bandY + 20, { align: 'right' });
    doc.setFont('times', 'italic'); doc.setFontSize(15); rgb(GOLD_DEEP);
    doc.text(
      cc.capped ? 'Decades sooner' : `${fmtYears(Math.max(0, cc.months - 24))} sooner`,
      W - M - 18, bandY + 46, { align: 'right' }
    );
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); rgb(INK_2);
    doc.text(`${pctSave}% reduction · $${Math.round(ld.monthly)}/mo fixed`, W - M - 18, bandY + 64, { align: 'right' });

    // -------- Comparison chart --------
    const chartTop = bandY + bandH + 30;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); rgb(MUTE);
    doc.text('TOTAL PAID — SIDE BY SIDE', M, chartTop - 10);

    const values = [cc.totalPaid, ds.totalProgram, ld.total];
    const labels = ['Credit card minimums', 'Debt settlement', 'Legal Debt Resolution'];
    const subs = [
      cc.capped ? 'Over 100+ years' : `Over ${fmtYears(cc.months)}`,
      `Over ${ds.months} months`,
      'Over 24 months'
    ];
    const highlight = [false, false, true];
    const maxV = Math.max(...values) || 1;
    const rowH = 42;
    const chartLeftLabelW = 150;
    const chartBarMaxW = (W - M * 2) - chartLeftLabelW - 110;
    values.forEach((v, i) => {
      const y = chartTop + i * rowH;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
      rgb(highlight[i] ? GOLD : INK);
      doc.text(labels[i], M, y + 12);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); rgb(MUTE);
      doc.text(subs[i], M, y + 24);

      const barX = M + chartLeftLabelW;
      const barW = Math.max(3, (v / maxV) * chartBarMaxW);
      fill(highlight[i] ? GOLD : [220, 215, 205]);
      doc.roundedRect(barX, y + 4, barW, 20, 3, 3, 'F');

      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
      rgb(highlight[i] ? GOLD : INK);
      doc.text(fmtMoney(v), barX + barW + 7, y + 18);
    });

    const chartEnd = chartTop + values.length * rowH + 8;
    stroke(HAIR); doc.line(M, chartEnd, W - M, chartEnd);

    // -------- Scenario ribbon (3 cols × 2 rows) --------
    const ribbonY = chartEnd + 18;
    const details = [
      ['DEBT LOAD', fmtMoney(debt)],
      ['REPRESENTATIVE APR', apr.toFixed(2) + '%'],
      ['MIN. MONTHLY (CARDS)', fmtMoney(cc.firstMin)],
      ['SETTLEMENT', `${fmtMoney(ds.monthly)} · ${ds.months}mo`],
      ['LEGAL MONTHLY', `${fmtMoney(ld.monthly)} · 24mo`],
      ['PRICING TIER', ld.tierLabel]
    ];
    const ribCols = 3;
    const ribColW = (W - M * 2) / ribCols;
    details.forEach((d, i) => {
      const col = i % ribCols;
      const row = Math.floor(i / ribCols);
      const x = M + col * ribColW;
      const y = ribbonY + row * 34;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); rgb(MUTE);
      doc.text(d[0], x, y);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); rgb(INK);
      doc.text(d[1], x, y + 14);
    });

    // -------- Your rights · consumer protection --------
    const rightsY = ribbonY + 76;
    stroke(HAIR); doc.line(M, rightsY - 14, W - M, rightsY - 14);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); rgb(MUTE);
    doc.text('YOUR PROTECTIONS UNDER FEDERAL LAW', M, rightsY);
    doc.setFont('times', 'italic'); doc.setFontSize(11); rgb(INK_2);
    const rightsLead = wrap(
      'Our Legal Debt Resolution team enforces the consumer protections your creditors routinely violate. If any of the following has happened to you, you have a claim.',
      W - M * 2
    );
    doc.text(rightsLead, M, rightsY + 14);

    const rightsListY = rightsY + 14 + rightsLead.length * 14 + 8;
    const rightsGroups = [
      { k: 'FDCPA',
        t: 'Debt Collection',
        items: ['Harassment or abusive calls', 'Failure to validate debt', 'Collection during active dispute', 'Calls at work or after 9 PM'] },
      { k: 'FCRA',
        t: 'Credit Reporting',
        items: ['Inaccurate information reported', 'Re-aging old debts', 'Unauthorized credit pulls', 'Failure to correct errors'] },
      { k: 'TILA · EFTA',
        t: 'Lending & Payments',
        items: ['Hidden APR, fees, balloon terms', 'Unauthorized ACH auto-drafts', 'Refusing to cancel auto-pay', 'Incorrect balance accounting'] },
      { k: 'FCBA · ECOA',
        t: 'Billing & Discrimination',
        items: ['Unauthorized charges not corrected', 'Late fees on disputed balances', 'Lending discrimination', 'No written reason for denial'] }
    ];
    const colCount = 2;
    const rightsColW = (W - M * 2 - 20) / colCount;
    const colH = 118;
    rightsGroups.forEach((g, i) => {
      const col = i % colCount;
      const row = Math.floor(i / colCount);
      const x = M + col * (rightsColW + 20);
      const y = rightsListY + row * (colH + 8);

      fill(PAPER_2); stroke(HAIR); doc.setLineWidth(0.5);
      doc.roundedRect(x, y, rightsColW, colH, 6, 6, 'FD');
      // gold rule on left
      fill(GOLD); doc.rect(x, y, 2, colH, 'F');

      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); rgb(GOLD_DEEP);
      doc.text(g.k, x + 12, y + 16);
      doc.setFont('times', 'normal'); doc.setFontSize(12); rgb(INK);
      doc.text(g.t, x + 12, y + 32);

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); rgb(INK_2);
      g.items.forEach((it, j) => {
        const ly = y + 48 + j * 13;
        // dot
        fill(GOLD); doc.circle(x + 14, ly - 3, 1.1, 'F');
        rgb(INK_2);
        doc.text(it, x + 20, ly);
      });
    });

    const rightsEnd = rightsListY + 2 * (colH + 8);

    // -------- Bottom line --------
    const closeY = rightsEnd + 6;
    stroke(HAIR); doc.line(M, closeY, W - M, closeY);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); rgb(MUTE);
    doc.text('THE BOTTOM LINE', M, closeY + 18);

    const bottomLine = wrap(
      `${fmtMoney(ld.monthly)} per month for 24 months — finishing in ${finishDateFromMonths(24)}. The alternatives stretch ${cc.capped ? 'over a century' : 'for years'} or cost roughly ${fmtMoney(Math.max(0, ds.totalProgram - ld.total))} more. Legal Debt Resolution is the shortest, cheapest, and most defined path on this page.`,
      W - M * 2
    );
    doc.setFont('times', 'normal'); doc.setFontSize(11.5); rgb(INK);
    doc.text(bottomLine, M, closeY + 36);

    // Notes if any
    if (notes) {
      const nY = closeY + 36 + bottomLine.length * 14 + 6;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); rgb(MUTE);
      doc.text('FROM YOUR CONSULTATION', M, nY);
      doc.setFont('times', 'italic'); doc.setFontSize(10); rgb(INK_2);
      const nLines = wrap(notes, W - M * 2);
      doc.text(nLines, M, nY + 14);
    }

    // -------- Footer --------
    stroke(HAIR); doc.line(M, H - 44, W - M, H - 44);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); rgb(FAINT);
    const foot = wrap(
      'Illustrative rep tool. Actual creditor minimums, settlement results, fees, and legal resolution outcomes vary by account, creditor, servicing terms, and state. Rights summary based on FDCPA, FCRA, TILA, EFTA, FCBA, and ECOA. Clients should review all program documents before enrolling.',
      W - M * 2
    );
    doc.text(foot, M, H - 30);

    const safe = client.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'client';
    doc.save(`providence-comparison-${safe}.pdf`);

    // Log export (fire-and-forget)
    try {
      fetch('/api/pdf-log', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ts: new Date().toISOString(),
          client, rep, debt, apr,
          legal: { monthly: ld.monthly, tier: ld.tierLabel, total: ld.total },
          settlement: { monthly: ds.monthly, months: ds.months, mode: ds.mode },
          cc: { firstMin: cc.firstMin, totalPaid: cc.totalPaid, months: cc.months, capped: cc.capped }
        })
      }).catch(() => {});
    } catch (e) { /* ignore */ }

    toast('PDF exported');
  }

  // ---------- Mode switcher ----------
  const modeButtons = document.querySelectorAll('.mode-switch button');
  function setMode(mode) {
    document.body.classList.remove('mode-editorial', 'mode-analyst', 'mode-presenter');
    document.body.classList.add('mode-' + mode);
    modeButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    try { localStorage.setItem('pfs.mode', mode); } catch (e) {}
  }
  modeButtons.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  try {
    const saved = localStorage.getItem('pfs.mode');
    if (saved) setMode(saved);
  } catch (e) {}

  // ---------- Chart metric switcher ----------
  document.querySelectorAll('.chart-legend button').forEach(b => {
    b.addEventListener('click', () => {
      chartMetric = b.dataset.metric;
      document.querySelectorAll('.chart-legend button').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn === b));
      });
      drawChart(getState());
    });
  });

  // ---------- Events ----------
  debtSlider.addEventListener('input', render);
  aprSlider.addEventListener('input', render);
  debtInput.addEventListener('input', () => {
    let v = Number(debtInput.value || 0);
    if (!Number.isFinite(v)) return;
    v = Math.min(350000, Math.max(1000, Math.round(v / 500) * 500));
    debtSlider.value = v; render();
  });
  aprInput.addEventListener('input', () => {
    let v = Number(aprInput.value || 0);
    if (!Number.isFinite(v)) return;
    v = Math.min(35, Math.max(0, v));
    aprSlider.value = v; render();
  });
  settlementOverrideToggle.addEventListener('change', render);
  settlementMonthlyInput.addEventListener('input', render);
  settlementMonthsInput.addEventListener('input', render);
  [settlementMonthly, settlementTimeline].forEach((el, idx) => {
    el.addEventListener('dblclick', () => {
      if (!settlementOverrideToggle.checked) return;
      const raw = idx === 0 ? settlementMonthlyInput.value : settlementMonthsInput.value;
      const fallback = Number((el.textContent || '').replace(/[^\d.]/g, '')) || '';
      const answer = window.prompt(
        idx === 0 ? 'Manual settlement monthly' : 'Manual settlement months',
        raw || fallback
      );
      if (answer === null) return;
      if (idx === 0) settlementMonthlyInput.value = Math.max(0, Number(answer) || 0);
      else settlementMonthsInput.value = Math.max(1, Number(answer) || 1);
      render();
    });
  });

  $('resetBtn').addEventListener('click', () => {
    debtSlider.value = 25000; aprSlider.value = 19.57;
    debtInput.value = 25000; aprInput.value = 19.57;
    clientName.value = ''; repName.value = ''; scenarioNotes.value = '';
    settlementOverrideToggle.checked = false;
    settlementMonthlyInput.value = ''; settlementMonthsInput.value = '';
    render();
    toast('Reset to defaults');
  });
  $('copyBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summaryText.textContent);
      toast('Summary copied');
    } catch (e) { toast('Copy failed'); }
  });
  $('pdfBtn').addEventListener('click', exportPdf);
  $('pdfBtn2').addEventListener('click', exportPdf);

  // ---------- Tweaks (host contract) ----------
  const tweaksEl = $('tweaks');
  let tweakState = {};
  try {
    // read from the editmode JSON in DOM
    const script = [...document.scripts].find(s => s.textContent && s.textContent.indexOf('EDITMODE-BEGIN') !== -1);
    if (script) {
      const m = script.textContent.match(/EDITMODE-BEGIN\*\/(\{[\s\S]*?\})\/\*EDITMODE-END/);
      if (m) tweakState = JSON.parse(m[1]);
    }
  } catch (e) {}

  function applyTweaks(t) {
    // Accent
    const root = document.documentElement;
    const accents = {
      gold:   { g: '#b89658', hi: '#d4b97e', d: '#7a6132' },
      ivory:  { g: '#d8cfb9', hi: '#eee6d1', d: '#8a8270' },
      brass:  { g: '#c4893a', hi: '#dea65a', d: '#7a5320' }
    };
    const a = accents[t.accent] || accents.gold;
    root.style.setProperty('--gold', a.g);
    root.style.setProperty('--gold-hi', a.hi);
    root.style.setProperty('--gold-deep', a.d);
    // Serif
    const serifs = {
      instrument: '"Instrument Serif", Georgia, serif',
      fraunces: '"Fraunces", "Instrument Serif", Georgia, serif',
      cormorant: '"Cormorant Garamond", "Instrument Serif", Georgia, serif'
    };
    root.style.setProperty('--serif', serifs[t.serif] || serifs.instrument);
    // Density
    if (t.density === 'compact') document.body.style.setProperty('--stage-pad', '20px');
    else document.body.style.removeProperty('--stage-pad');
  }
  applyTweaks(tweakState);

  const selAccent = $('tweak-accent');
  const selSerif = $('tweak-serif');
  const selDensity = $('tweak-density');
  if (selAccent) selAccent.value = tweakState.accent || 'gold';
  if (selSerif) selSerif.value = tweakState.serif || 'instrument';
  if (selDensity) selDensity.value = tweakState.density || 'airy';

  function onTweakChange() {
    tweakState = {
      ...tweakState,
      accent: selAccent.value,
      serif: selSerif.value,
      density: selDensity.value
    };
    applyTweaks(tweakState);
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweakState }, '*');
    } catch (e) {}
  }
  [selAccent, selSerif, selDensity].forEach(s => s && s.addEventListener('change', onTweakChange));

  // Edit-mode protocol: register listener FIRST, then announce
  window.addEventListener('message', (ev) => {
    const d = ev && ev.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === '__activate_edit_mode') tweaksEl.classList.add('show');
    else if (d.type === '__deactivate_edit_mode') tweaksEl.classList.remove('show');
  });
  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch (e) {}

  // Kick it off
  render();
})();
