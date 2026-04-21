const debtSlider = document.getElementById('debtSlider');
    const aprSlider = document.getElementById('aprSlider');
    const debtInput = document.getElementById('debtInput');
    const aprInput = document.getElementById('aprInput');
    const clientName = document.getElementById('clientName');
    const repName = document.getElementById('repName');
    const scenarioNotes = document.getElementById('scenarioNotes');

    const debtValue = document.getElementById('debtValue');
    const aprValue = document.getElementById('aprValue');
    const minPayment = document.getElementById('minPayment');
    const payoffTime = document.getElementById('payoffTime');
    const totalPaid = document.getElementById('totalPaid');
    const interestPaid = document.getElementById('interestPaid');
    const settlementMonthly = document.getElementById('settlementMonthly');
    const settlementTimeline = document.getElementById('settlementTimeline');
    const settlementPrincipal = document.getElementById('settlementPrincipal');
    const settlementFees = document.getElementById('settlementFees');
    const settlementOverrideToggle = document.getElementById('settlementOverrideToggle');
    const settlementOverrideFields = document.getElementById('settlementOverrideFields');
    const settlementMonthlyInput = document.getElementById('settlementMonthlyInput');
    const settlementMonthsInput = document.getElementById('settlementMonthsInput');
    const legalMonthly = document.getElementById('legalMonthly');
    const legalTimeline = document.getElementById('legalTimeline');
    const legalTier = document.getElementById('legalTier');
    const legalTotal = document.getElementById('legalTotal');
    const summaryText = document.getElementById('summaryText');
    const amortRows = document.getElementById('amortRows');

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

    function fmtMoney(n, digits = 0) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
    }
    function fmtYears(months) {
      const years = Math.floor(months / 12); const rem = months % 12;
      if (years <= 0) return `${rem} mo`;
      if (rem === 0) return `${years}y`;
      return `${years}y ${rem}m`;
    }
    function calcCreditCard(debt, apr) {
      let balance = debt, month = 0, total = 0, firstMin = 0; const monthlyRate = apr / 100 / 12; const preview = [];
      while (balance > 0.01 && month < 1200) {
        const interest = balance * monthlyRate;
        let payment = Math.max(balance * 0.01 + interest, 35);
        if (payment > balance + interest) payment = balance + interest;
        const principalPaid = payment - interest;
        balance = Math.max(0, balance - principalPaid);
        month += 1; total += payment; if (month === 1) firstMin = payment;
        if (preview.length < 12) preview.push({ month, payment, interest, balance });
      }
      return { firstMin, months: month, totalPaid: total, interestPaid: Math.max(0, total - debt), preview, capped: month >= 1200 && balance > 0.01 };
    }
    function calcSettlement(debt) {
      const months = 55;
      const settledPrincipal = debt * 0.50;
      const fees = debt * 0.20;
      const totalProgram = settledPrincipal + fees;
      const monthly = totalProgram / months;
      const manual = settlementOverrideToggle && settlementOverrideToggle.checked;
      if (manual) {
        const manualMonthly = Math.max(0, Number(settlementMonthlyInput.value || 0));
        const manualMonths = Math.max(1, Number(settlementMonthsInput.value || 0));
        if (manualMonthly > 0 && manualMonths > 0) {
          return { settledPrincipal, fees, totalProgram: manualMonthly * manualMonths, months: manualMonths, monthly: manualMonthly, mode: 'Manual quote' };
        }
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
      const total = tier.payment * months;
      return { monthly: tier.payment, months, total, tierLabel: `Up to ${fmtMoney(tier.upTo)}` };
    }
    function getState() {
      const debt = Math.max(0, Number(debtSlider.value));
      const apr = Math.max(0, Number(aprSlider.value));
      const cc = calcCreditCard(debt, apr);
      const ds = calcSettlement(debt);
      const ld = calcLegal(debt);
      return { debt, apr, cc, ds, ld };
    }
    function render() {
      const { debt, apr, cc, ds, ld } = getState();
      debtValue.textContent = fmtMoney(debt);
      aprValue.textContent = `${apr.toFixed(2)}%`;
      debtInput.value = debt;
      aprInput.value = apr.toFixed(2);
      minPayment.textContent = fmtMoney(cc.firstMin);
      payoffTime.textContent = cc.capped ? '100+ yrs' : fmtYears(cc.months);
      totalPaid.textContent = fmtMoney(cc.totalPaid);
      interestPaid.textContent = fmtMoney(cc.interestPaid);
      settlementMonthly.textContent = fmtMoney(ds.monthly);
      settlementTimeline.textContent = `${ds.months} mo`;
      settlementPrincipal.textContent = fmtMoney(ds.totalProgram);
      settlementFees.textContent = ds.mode;
      settlementOverrideFields.hidden = !settlementOverrideToggle.checked;
      legalMonthly.textContent = fmtMoney(ld.monthly);
      legalTimeline.textContent = `${ld.months} mo`;
      legalTier.textContent = ld.tierLabel.replace('$', '$');
      legalTotal.textContent = fmtMoney(ld.total);
      summaryText.textContent = `On a ${fmtMoney(debt)} debt load, credit card minimum payments at ${apr.toFixed(2)}% APR start around ${fmtMoney(cc.firstMin)} and can keep the client paying for ${cc.capped ? '100+ years' : fmtYears(cc.months)}. The debt settlement comparison is currently ${ds.mode === 'Manual quote' ? 'using a manual competitor quote' : 'using the fixed average illustration'} at ${fmtMoney(ds.monthly)}/month over ${ds.months} months, while Providence Financial Solutions' Legal Debt Resolution is illustrated at ${fmtMoney(ld.monthly)}/month over a defined 24-month timeline${debt >= 130000 ? ' with the $1,500 monthly cap applied' : ' based on the matching pricing tier'}. For many clients, that means a clearer finish line, less monthly pressure, and a more defined path forward than staying stuck in revolving debt.`;
      amortRows.innerHTML = cc.preview.map(r => `<tr><td>${r.month}</td><td>${fmtMoney(r.payment, 2)}</td><td>${fmtMoney(r.interest, 2)}</td><td>${fmtMoney(r.balance, 2)}</td></tr>`).join('');
    }

    async function exportPdf() {
      const { jsPDF } = window.jspdf;
      const { debt, apr, cc, ds, ld } = getState();
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageW = 612;
      const pageH = 792;
      const margin = 42;
      const contentW = pageW - margin * 2;
      const client = clientName.value.trim() || 'Client';
      const notes = scenarioNotes.value.trim();
      const monthlyGapVsCards = Math.max(0, cc.firstMin - ld.monthly);
      const monthlyGapVsSettlement = Math.max(0, ds.monthly - ld.monthly);
      const totalGapVsCards = Math.max(0, cc.totalPaid - ld.total);
      const timeSavedVsSettlement = Math.max(0, ds.months - ld.months);
      const gold = [176, 138, 55];
      const ink = [20, 20, 20];
      const gray = [92, 92, 92];
      const soft = [247, 244, 238];
      const line = [224, 216, 201];

      const wrap = (txt, w) => doc.splitTextToSize(txt, w);
      const pageChrome = () => {
        doc.setFillColor(255,255,255); doc.rect(0,0,pageW,pageH,'F');
        doc.setFillColor(...gold); doc.rect(0,0,pageW,8,'F');
        doc.setDrawColor(...line); doc.line(margin, 744, pageW - margin, 744);
        doc.setFont('helvetica','normal'); doc.setFontSize(8.2); doc.setTextColor(...gray);
        const footer = wrap('This comparison is for illustrative purposes only. Actual creditor minimums, results, timelines, program structures, tax treatment, and outcomes vary by account, creditor, servicing terms, and state. Clients should review all program documents carefully before enrolling.', contentW);
        doc.text(footer, margin, 760);
      };
      const sectionCard = (x, y, w, h, title) => {
        doc.setFillColor(...soft); doc.setDrawColor(...line); doc.setLineWidth(1);
        doc.roundedRect(x, y, w, h, 14, 14, 'FD');
        doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...ink);
        doc.text(title, x + 14, y + 22);
      };
      const metricBox = (x, y, w, h, label, value, highlight=false) => {
        doc.setFillColor(255,255,255); doc.setDrawColor(...(highlight ? gold : line)); doc.setLineWidth(highlight ? 1.5 : 1);
        doc.roundedRect(x, y, w, h, 14, 14, 'FD');
        if (highlight) { doc.setFillColor(...gold); doc.roundedRect(x, y, w, 8, 14, 14, 'F'); }
        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...gray);
        doc.text(label.toUpperCase(), x + 12, y + 24);
        doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...ink);
        doc.text(wrap(value, w - 24), x + 12, y + 46);
      };
      const bulletText = (items, x, y, w, size=10.2, leading=13) => {
        doc.setFont('helvetica','normal'); doc.setFontSize(size); doc.setTextColor(...ink);
        let yy = y;
        items.forEach(item => {
          const lines = wrap('• ' + item, w);
          doc.text(lines, x, yy);
          yy += lines.length * leading + 2;
        });
        return yy;
      };
      const numberedText = (items, x, y, w, size=10, leading=12.5) => {
        doc.setFont('helvetica','normal'); doc.setFontSize(size); doc.setTextColor(...ink);
        let yy = y;
        items.forEach((item, i) => {
          const lines = wrap(`${i + 1}. ${item}`, w);
          doc.text(lines, x, yy);
          yy += lines.length * leading + 4;
        });
        return yy;
      };
      const comparisonBox = (x, y, w, h, title, badge, lines, highlight=false) => {
        doc.setFillColor(255,255,255); doc.setDrawColor(...(highlight ? gold : line)); doc.setLineWidth(highlight ? 1.5 : 1);
        doc.roundedRect(x, y, w, h, 14, 14, 'FD');
        doc.setFillColor(...(highlight ? gold : [232, 225, 210]));
        doc.roundedRect(x + 12, y + 12, 104, 18, 9, 9, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(8.4); doc.setTextColor(...(highlight ? [255,255,255] : ink));
        doc.text(badge.toUpperCase(), x + 20, y + 24);
        doc.setFont('helvetica','bold'); doc.setFontSize(11.5); doc.setTextColor(...ink);
        const titleLines = wrap(title, w - 24);
        doc.text(titleLines, x + 12, y + 46);
        const titleHeight = titleLines.length * 11.2;
        bulletText(lines, x + 12, y + 62 + titleHeight, w - 24, 8.8, 10.6);
      };

      const textHeight = (lines, leading=12) => lines.length * leading;
      const addHeader = (title, size=18) => {
        pageChrome();
        let yy = 34;
        doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...gold);
        doc.text('PROVIDENCE FINANCIAL SOLUTIONS', margin, yy);
        yy += 18;
        doc.setDrawColor(...line); doc.line(margin, yy, pageW - margin, yy);
        yy += 22;
        doc.setFont('helvetica','bold'); doc.setFontSize(size); doc.setTextColor(...ink);
        const titleLines = wrap(title, contentW);
        doc.text(titleLines, margin, yy);
        yy += textHeight(titleLines, size >= 20 ? 12 : 11.2) + 10;
        return yy;
      };
      const ensureSpace = (needed, title='Your comparison summary') => {
        if (y + needed <= pageH - 26) return;
        doc.addPage();
        y = addHeader(title, 18);
      };

      let y = addHeader('A Promising Future out of Debt starts with the Right Structure.', 20);

      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...gray);
      const intro = wrap(`Prepared for ${client}. Based on ${fmtMoney(debt)} in debt and a representative credit card APR of ${apr.toFixed(2)}%, this snapshot shows why many clients prefer a more defined path instead of staying trapped in revolving balances.`, contentW);
      doc.text(intro, margin, y);
      y += textHeight(intro, 11) + 12;

      const statGap = 10;
      const statW = (contentW - statGap * 2) / 3;
      metricBox(margin, y, statW, 68, 'Estimated legal monthly', `${fmtMoney(ld.monthly)}/month`, true);
      metricBox(margin + statW + statGap, y, statW, 68, 'Defined timeline', '24 months');
      metricBox(margin + (statW + statGap) * 2, y, statW, 68, 'Est. savings vs minimums', fmtMoney(totalGapVsCards));
      y += 84;

      const whyLines = [
        `${fmtMoney(ld.monthly)}/month is about ${fmtMoney(monthlyGapVsCards)}/month less than the starting credit card minimum in this scenario.`,
        `It is also about ${fmtMoney(monthlyGapVsSettlement)}/month less than this debt settlement illustration while reaching a finish line ${timeSavedVsSettlement} months sooner.`,
        `Instead of paying month after month without a clear end, this structure gives you a defined payment and a defined end point.`
      ];
      const whyNeeded = 38 + whyLines.map(line => wrap(`• ${line}`, contentW - 28).length * 11.2 + 4).reduce((a,b) => a + b, 0) + 12;
      sectionCard(margin, y, contentW, whyNeeded, 'Why many clients lean toward Legal Debt Resolution');
      y = bulletText(whyLines, margin + 14, y + 38, contentW - 28, 9.7, 11.2) + 10;

      const colGap = 12;
      const boxW = (contentW - colGap * 2) / 3;
      const boxH = 172;
      ensureSpace(boxH + 8, 'Your comparison summary');
      comparisonBox(margin, y, boxW, boxH, 'Paying the Minimums', 'status quo', [
        `Starting payment: ${fmtMoney(cc.firstMin)}/month`,
        `Estimated payoff: ${cc.capped ? '100+ years' : fmtYears(cc.months)}`,
        `Total paid: ${fmtMoney(cc.totalPaid)}`,
        `Interest paid: ${fmtMoney(cc.interestPaid)}`
      ]);
      comparisonBox(margin + boxW + colGap, y, boxW, boxH, 'Typical debt settlement', 'common option', [
        `Estimated monthly deposit: ${fmtMoney(ds.monthly)}`,
        `${ds.mode === 'Manual quote' ? 'Manual quote entered by rep' : 'Typical timeline used here'}: ${ds.months} months`,
        `“Settled for less” remarks can damage credit for up to 7 years.`,
        `Forgiven balances may also create taxable implications.`
      ]);
      comparisonBox(margin + (boxW + colGap) * 2, y, boxW, boxH, 'Legal Debt Resolution', 'recommended', [
        `Estimated monthly payment: ${fmtMoney(ld.monthly)}`,
        `Defined timeline: 24 months`,
        `Pricing tier used: ${ld.tierLabel}`,
        `These settlement-style credit and tax issues are typically not seen here in the same way.`
      ], true);
      y += boxH + 18;

      doc.addPage();
      y = addHeader('How Legal Debt Resolution works', 18);

      const processIntro = wrap('Providence Financial Solutions connects you with licensed consumer rights attorneys who use federal law to challenge whether debts are valid, accurately reported, and legally collectible. This is a structured legal process designed to create leverage, reduce pressure on you, and move your case toward resolution.', contentW);
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...gray);
      doc.text(processIntro, margin, y);
      y += textHeight(processIntro, 11) + 12;

      const stepGap = 12;
      const stepW = (contentW - stepGap) / 2;
      const calcStepHeight = (title, body) => {
        const titleLines = wrap(title, stepW - 56);
        const bodyLines = wrap(body, stepW - 28);
        return 32 + titleLines.length * 12 + bodyLines.length * 10.4 + 20;
      };
      const stepCard = (x, y, w, h, num, title, body) => {
        doc.setFillColor(255,255,255); doc.setDrawColor(...line); doc.setLineWidth(1);
        doc.roundedRect(x, y, w, h, 14, 14, 'FD');
        doc.setFillColor(...gold); doc.circle(x + 24, y + 24, 12, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(255,255,255);
        doc.text(String(num), x + 20.5, y + 28);
        doc.setFont('helvetica','bold'); doc.setFontSize(11.3); doc.setTextColor(...ink);
        const titleLines = wrap(title, w - 56);
        doc.text(titleLines, x + 44, y + 22);
        const titleBlockHeight = titleLines.length * 12;
        doc.setFont('helvetica','normal'); doc.setFontSize(8.9); doc.setTextColor(...ink);
        const bodyLines = wrap(body, w - 28);
        doc.text(bodyLines, x + 14, y + 24 + titleBlockHeight + 11);
      };

      const steps = [
        ['Compared with traditional debt settlement', 'Rather than relying on long hold periods, heavy settlement fees, and “settled for less” credit remarks, this process is built to pursue leverage in a way that aims to reduce long-term credit damage and unnecessary cost.'],
        ['Attorney strategy is built', 'The partner attorneys map the path forward for your enrolled accounts using debt validation, credit reporting challenges, and violation review based on your facts.'],
        ['Creditors are required to prove their claims', 'Attorneys formally challenge whether each debt is valid, properly documented, accurately reported, and legally collectible.'],
        ['Your rights are enforced while the case moves toward resolution', 'Improper collection activity, reporting problems, billing errors, and unfair practices can create leverage as the case moves toward a defined resolution.']
      ];
      const h1 = calcStepHeight(...steps[0]);
      const h2 = calcStepHeight(...steps[1]);
      const h3 = calcStepHeight(...steps[2]);
      const h4 = calcStepHeight(...steps[3]);
      const row1H = Math.max(h1, h2);
      const row2H = Math.max(h3, h4);
      stepCard(margin, y, stepW, row1H, 1, ...steps[0]);
      stepCard(margin + stepW + stepGap, y, stepW, row1H, 2, ...steps[1]);
      y += row1H + 10;
      stepCard(margin, y, stepW, row2H, 3, ...steps[2]);
      stepCard(margin + stepW + stepGap, y, stepW, row2H, 4, ...steps[3]);
      y += row2H + 12;

      const rightsGap = 10;
      const rightsW = (contentW - rightsGap) / 2;
      const rightsCard = (x, y, w, title, points) => {
        const titleLines = wrap(title, w - 20);
        const pointHeights = points.map(p => wrap('• ' + p, w - 20).length * 9 + 2);
        const h = 26 + titleLines.length * 11 + pointHeights.reduce((a,b)=>a+b,0) + 10;
        doc.setFillColor(...soft); doc.setDrawColor(...line); doc.setLineWidth(1);
        doc.roundedRect(x, y, w, h, 12, 12, 'FD');
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...gold);
        doc.text(titleLines, x + 10, y + 18);
        bulletText(points, x + 10, y + 34, w - 20, 8.1, 9);
        return h;
      };

      const left1 = rightsCard(margin, y, rightsW, 'FDCPA | Debt Collection Violations', [
        'Failure to validate debt',
        'Continuing collection during dispute',
        'Harassment, threats, or abusive language',
        'False or misleading representations'
      ]);
      const right1 = rightsCard(margin + rightsW + rightsGap, y, rightsW, 'FCRA | Credit Reporting Violations', [
        'Reporting inaccurate information',
        'Failure to correct errors',
        'Re-aging debts to extend reporting',
        'Unauthorized credit pulls'
      ]);
      const rowA = Math.max(left1, right1);
      y += rowA + 10;

      const left2 = rightsCard(margin, y, rightsW, 'TILA / EFTA / FCBA', [
        'Improper APR or fee disclosures',
        'Unauthorized recurring drafts',
        'Refusal to cancel auto-pay',
        'Failure to investigate billing errors'
      ]);
      const right2 = rightsCard(margin + rightsW + rightsGap, y, rightsW, 'ECOA + Unfair Practices', [
        'Discrimination in lending decisions',
        'Failure to provide denial reasons',
        'Fee stacking or misleading statements',
        'Predatory terms designed to trap borrowers'
      ]);
      y += Math.max(left2, right2) + 8;

      doc.addPage();
      y = addHeader('Your comparison summary', 18);

      sectionCard(margin, y, contentW, 164, 'Your scenario at a glance');
      const leftX = margin + 14;
      const rightX = margin + contentW / 2 + 6;
      const rowY = y + 40;
      const leftItems = [
        ['Debt load evaluated', fmtMoney(debt)],
        ['Representative APR used', `${apr.toFixed(2)}%`],
        ['Credit card minimum starts around', `${fmtMoney(cc.firstMin)}/month`],
        ['Debt settlement illustration', `${fmtMoney(ds.monthly)}/month for ${ds.months} months`],
        ['Legal Debt Resolution', `${fmtMoney(ld.monthly)}/month for 24 months`]
      ];
      const rightItems = [
        ['Total paid on minimums', fmtMoney(cc.totalPaid)],
        ['Interest paid on minimums', fmtMoney(cc.interestPaid)],
        ['Estimated savings vs minimums', fmtMoney(totalGapVsCards)],
        ['Time saved vs settlement', `${Math.max(0, ds.months - ld.months)} months`],
        ['Pricing tier applied', ld.tierLabel]
      ];
      const drawPairs = (items, x, yy) => {
        items.forEach(([k,v], idx) => {
          const y0 = yy + idx * 26;
          doc.setFont('helvetica','bold'); doc.setFontSize(8.9); doc.setTextColor(...gray);
          doc.text(k.toUpperCase(), x, y0);
          doc.setFont('helvetica','bold'); doc.setFontSize(10.6); doc.setTextColor(...ink);
          doc.text(wrap(v, contentW / 2 - 26), x, y0 + 11);
        });
      };
      drawPairs(leftItems, leftX, rowY);
      drawPairs(rightItems, rightX, rowY);
      y += 182;

      const snapshotPoints = [
        'Minimum payments can feel manageable at first, but interest absorbs too much of each payment and stretches the debt far longer than most people expect.',
        'Debt settlement may sound attractive on the front end, but the longer timeline, possible tax exposure on forgiven amounts, and “settled for less” remarks that can remain for up to 7 years are major tradeoffs many people never see coming.',
        'Legal Debt Resolution is illustrated here as the clearest structure: a lower monthly burden than the alternatives shown, a defined 24-month timeline, and a path many clients experience as more direct and more stable.'
      ];
      const snapHeight = 38 + snapshotPoints.map((p, i) => wrap(`${i+1}. ${p}`, contentW - 28).length * 11.2 + 4).reduce((a,b) => a + b, 0) + 10;
      sectionCard(margin, y, contentW, snapHeight, 'What this snapshot is really showing you');
      numberedText(snapshotPoints, margin + 14, y + 38, contentW - 28, 9.3, 11.2);
      y += snapHeight + 14;

      const ctaLines = wrap('If a lower monthly payment, a shorter timeline, and a more defined path forward matter to you, the next move is simple: move forward with the structure that gives you the clearest finish line and the best chance to regain control quickly.', contentW - 28);
      const questionPoints = [
        'How long will I realistically be in this program?',
        'What will my monthly commitment actually look like?',
        'What hidden credit or tax consequences could follow me after the balance is resolved?'
      ];
      const questionsHeight = questionPoints.map(q => wrap(`• ${q}`, contentW - 28).length * 11.2 + 3).reduce((a,b) => a + b, 0);
      const notesLines = notes ? wrap(notes, contentW - 28) : [];
      const notesHeight = notes ? 30 + textHeight(notesLines, 10.6) : 0;
      const nextHeight = 38 + textHeight(ctaLines, 11.2) + 12 + 14 + questionsHeight + notesHeight + 14;
      ensureSpace(nextHeight + 6, 'Your next step');
      sectionCard(margin, y, contentW, nextHeight, 'A practical next step');
      doc.setFont('helvetica','normal'); doc.setFontSize(9.9); doc.setTextColor(...ink);
      doc.text(ctaLines, margin + 14, y + 38);
      let yy = y + 38 + textHeight(ctaLines, 11.2) + 10;
      doc.setFont('helvetica','bold'); doc.setFontSize(10.1); doc.setTextColor(...gold);
      doc.text('Questions to ask before choosing any path:', margin + 14, yy);
      yy += 15;
      yy = bulletText(questionPoints, margin + 14, yy, contentW - 28, 9.3, 11.2) + 2;
      if (notes) {
        doc.setDrawColor(...line); doc.line(margin + 14, yy + 2, pageW - margin - 14, yy + 2);
        yy += 16;
        doc.setFont('helvetica','bold'); doc.setFontSize(10.1); doc.setTextColor(...ink);
        doc.text('Notes from your consultation', margin + 14, yy);
        yy += 13;
        doc.setFont('helvetica','normal'); doc.setFontSize(9.1); doc.setTextColor(...gray);
        doc.text(notesLines, margin + 14, yy);
      }
      const safeName = client.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'client';
      doc.save(`providence-client-comparison-${safeName}.pdf`);
    }
    debtSlider.addEventListener('input', render);
    aprSlider.addEventListener('input', render);
    debtInput.addEventListener('change', () => {
      let v = Number(debtInput.value || 0);
      v = Math.min(350000, Math.max(1000, Math.round(v / 500) * 500));
      debtSlider.value = v; render();
    });
    aprInput.addEventListener('change', () => {
      let v = Number(aprInput.value || 0);
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
        const answer = window.prompt(idx === 0 ? 'Enter manual debt settlement monthly quote' : 'Enter manual debt settlement timeline in months', raw || fallback);
        if (answer === null) return;
        if (idx === 0) settlementMonthlyInput.value = Math.max(0, Number(answer) || 0);
        else settlementMonthsInput.value = Math.max(1, Number(answer) || 1);
        render();
      });
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
      debtSlider.value = 25000; aprSlider.value = 19.57; debtInput.value = 25000; aprInput.value = 19.57; clientName.value = ''; repName.value = ''; scenarioNotes.value = ''; settlementOverrideToggle.checked = false; settlementMonthlyInput.value = ''; settlementMonthsInput.value = ''; render();
    });
    document.getElementById('copyBtn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(summaryText.textContent);
        const btn = document.getElementById('copyBtn'); const original = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => btn.textContent = original, 1200);
      } catch (e) { alert('Copy failed on this browser.'); }
    });
    document.getElementById('pdfBtn').addEventListener('click', exportPdf);
    render();