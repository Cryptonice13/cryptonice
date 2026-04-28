import { jsPDF } from 'jspdf';
import type { SafetyScan, SafetyFactor } from '@/hooks/useSafetyScan';

const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  good: [34, 197, 94],
  info: [59, 130, 246],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  critical: [185, 28, 28],
};

const RECO_COLORS: Record<string, [number, number, number]> = {
  BUY_OK: [34, 197, 94],
  CAUTION: [245, 158, 11],
  AVOID: [220, 38, 38],
};

function scoreColor(score: number): [number, number, number] {
  if (score >= 75) return [220, 38, 38];
  if (score >= 50) return [234, 88, 12];
  if (score >= 30) return [217, 119, 6];
  if (score >= 15) return [132, 204, 22];
  return [16, 185, 129];
}

export function generateSafetyReportPdf(scan: SafetyScan): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Token Safety Report', margin, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 200, 220);
  doc.text(
    `Generated ${new Date().toLocaleString()}  •  cryptonice.lovable.app`,
    margin,
    50
  );
  y = 100;

  // Token block
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const tokenLine = `${scan.token_name || 'Unknown Token'}${scan.token_symbol ? ` (${scan.token_symbol})` : ''}`;
  doc.text(tokenLine, margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Chain: ${scan.chain.toUpperCase()}`, margin, y);
  y += 12;
  doc.text(`Contract: ${scan.contract_address}`, margin, y);
  y += 22;

  // Score + recommendation row
  const boxW = (pageW - margin * 2 - 12) / 2;
  const boxH = 90;

  // Score box
  const [sr, sg, sb] = scoreColor(scan.risk_score);
  doc.setFillColor(sr, sg, sb);
  doc.roundedRect(margin, y, boxW, boxH, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.text(`${scan.risk_score}`, margin + 16, y + 50);
  doc.setFontSize(10);
  doc.text('/ 100', margin + 16 + doc.getTextWidth(`${scan.risk_score}`) + 4, y + 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('RISK SCORE', margin + 16, y + 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(scan.risk_level.toUpperCase(), margin + 16, y + 72);

  // Recommendation box
  const rx = margin + boxW + 12;
  const [rr, rg, rb] = RECO_COLORS[scan.recommendation] || [100, 116, 139];
  doc.setFillColor(rr, rg, rb);
  doc.roundedRect(rx, y, boxW, boxH, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('RECOMMENDATION', rx + 16, y + 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(scan.recommendation.replace('_', ' '), rx + 16, y + 56);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const recoSub =
    scan.recommendation === 'AVOID'
      ? 'Do not trade. High rug/honeypot risk.'
      : scan.recommendation === 'CAUTION'
      ? 'Trade only with small size & strict stop.'
      : 'Standard risks apply. Always DYOR.';
  doc.text(recoSub, rx + 16, y + 76);

  y += boxH + 22;

  // AI Verdict
  if (scan.ai_verdict) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.8);
    const verdictLines = doc.splitTextToSize(scan.ai_verdict, pageW - margin * 2 - 24);
    const verdictH = 28 + verdictLines.length * 12 + 12;
    doc.roundedRect(margin, y, pageW - margin * 2, verdictH, 6, 6, 'FD');
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('AI VERDICT', margin + 12, y + 18);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(verdictLines, margin + 12, y + 34);
    y += verdictH + 18;
  }

  // Factors header
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Risk Factors (${scan.factors?.length || 0} checks)`, margin, y);
  y += 14;

  // Factors list
  const factors: SafetyFactor[] = scan.factors || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const f of factors) {
    const labelLines = doc.splitTextToSize(f.label, pageW - margin * 2 - 90);
    const descLines = doc.splitTextToSize(f.description || '', pageW - margin * 2 - 24);
    const blockH = 18 + labelLines.length * 11 + descLines.length * 10 + 10;

    if (y + blockH > pageH - margin - 30) {
      doc.addPage();
      y = margin;
    }

    const [fr, fg, fb] = SEVERITY_COLORS[f.severity] || [148, 163, 184];
    // Severity stripe
    doc.setFillColor(fr, fg, fb);
    doc.roundedRect(margin, y, 4, blockH - 6, 2, 2, 'F');

    // Severity badge
    doc.setFillColor(fr, fg, fb);
    const sevText = f.severity.toUpperCase();
    doc.setFontSize(7);
    const sevW = doc.getTextWidth(sevText) + 10;
    doc.roundedRect(pageW - margin - sevW, y + 2, sevW, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(sevText, pageW - margin - sevW + 5, y + 10.5);

    // Label
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(labelLines, margin + 12, y + 11);

    // Value
    if (f.value) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(f.value, margin + 12, y + 11 + labelLines.length * 11);
    }

    // Description
    if (descLines.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(descLines, margin + 12, y + 11 + labelLines.length * 11 + (f.value ? 12 : 0));
    }

    y += blockH;
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Not financial advice. Always DYOR. Generated by CryptoNice Token Safety Scanner.',
      margin,
      pageH - 18
    );
    doc.text(`Page ${i} / ${pageCount}`, pageW - margin - 50, pageH - 18);
  }

  return doc;
}

export function downloadSafetyReportPdf(scan: SafetyScan) {
  const doc = generateSafetyReportPdf(scan);
  const safeName = (scan.token_symbol || scan.token_name || 'token')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`safety-report-${safeName}-${date}.pdf`);
}
