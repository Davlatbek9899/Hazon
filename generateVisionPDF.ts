import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateVisionPDF = async (vision: any) => {

  // ─── NORMALIZE ────────────────────────────────────────────
  const title = vision.title || vision.vision_statement?.title || '';
  const subtitle = vision.vision_statement?.subtitle || vision.user_context?.season_of_life || '';
  const summary = typeof vision.vision_statement === 'object'
    ? vision.vision_statement?.summary || vision.vision_statement?.title || ''
    : vision.vision_statement || vision.visionStatement || '';
  const mandate = vision.objectives?.mandate || vision.mission_statement || vision.missionStatement || '';
  const financialGoal = vision.objectives?.financial_goal || '';

  let coreValues: any[] = [];
  if (vision.core_tenets?.length > 0) coreValues = vision.core_tenets.map((t: any) => ({ value: t.principle, description: t.description }));
  else if (vision.core_values?.length > 0) coreValues = vision.core_values;
  else if (vision.coreValues?.length > 0) coreValues = vision.coreValues.map((v: any) => ({ value: v.value || v, description: v.description || '' }));
  else if (vision.visualize?.values_to_live_by?.length > 0) coreValues = vision.visualize.values_to_live_by.map((v: string) => ({ value: v, description: '' }));

  let biblicalFoundation: any[] = [];
  if (vision.spiritual_foundation?.anchor_scriptures?.length > 0) {
    biblicalFoundation = vision.spiritual_foundation.anchor_scriptures.map((s: string) => {
      // Format: "Book Chapter:Verse - Verse text. - Explanation" yoki "Book Chapter:Verse - Explanation"
      const firstDash = s.indexOf(' - ');
      if (firstDash === -1) return { scripture: s, theme: '', explanation: '' };
      
      const scripture = s.substring(0, firstDash).trim();
      const rest = s.substring(firstDash + 3).trim();
      
      // rest ichida verse matni va izoh bor
      // Verse matni odatda qo'shtirnoq ichida yoki birinchi gap
      const secondDash = rest.indexOf(' - ');
      if (secondDash !== -1) {
        return {
          scripture,
          theme: rest.substring(0, secondDash).trim(),
          explanation: rest.substring(secondDash + 3).trim()
        };
      }
      // Faqat bitta qism — izoh sifatida qo'yamiz, verse yo'q
      return { scripture, theme: '', explanation: rest };
    });
  } else if (vision.biblical_foundation?.length > 0) {
    biblicalFoundation = vision.biblical_foundation.map((b: any) => ({ theme: b.theme || b.reference || '', scripture: b.scripture || '', explanation: b.explanation || '' }));
  } else if (vision.biblicalFoundation?.length > 0) {
    biblicalFoundation = vision.biblicalFoundation.map((b: any) => ({ theme: b.theme || b.reference || '', scripture: b.scripture || '', explanation: b.explanation || '' }));
  } else if (vision.reflect?.scripture_principles?.length > 0) {
    biblicalFoundation = vision.reflect.scripture_principles.map((p: string) => ({ theme: p, scripture: '' }));
  }

  const biblicalModels: any[] = vision.spiritual_foundation?.biblical_models || [];

  let strategicPillars: any[] = [];
  if (vision.strategic_pillars?.length > 0) strategicPillars = vision.strategic_pillars;
  else if (vision.strategicPillars?.length > 0) strategicPillars = vision.strategicPillars.map((p: any) => ({ pillar: p.pillar || p, description: p.description || '' }));

  // Declarations — ensure "In the name of Jesus" format
  const rawDeclarations: string[] = vision.spiritual_tools?.declarations || [];
  const declarations = rawDeclarations.map(d => {
    if (d.toLowerCase().startsWith('in the name of jesus') || d.toLowerCase().startsWith('in jesus')) return d;
    return `In the name of Jesus, I declare ${d.charAt(0).toLowerCase()}${d.slice(1)}`;
  });

  // Prayer — ensure "Heavenly Father" start and "In Jesus name, Amen" end
  let prayer: string = vision.spiritual_tools?.prayer || '';
  if (prayer && !prayer.startsWith('Heavenly Father')) {
    prayer = `Heavenly Father, ${prayer.charAt(0).toLowerCase()}${prayer.slice(1)}`;
  }
  if (prayer && !prayer.toLowerCase().includes('in jesus name, amen') && !prayer.toLowerCase().includes('in jesus\' name, amen')) {
    prayer = prayer.replace(/\.\s*$/, '') + '. In Jesus name, Amen.';
  }

  const reflectionPrompts: string[] = vision.spiritual_tools?.reflection_prompts || vision.reflect?.heart_check || [];

  // Next steps — always last
  let nextSteps: string[] = [];
  if (vision.next_steps?.length > 0) nextSteps = vision.next_steps;
  else if (vision.execution_strategy?.short_term_steps?.length > 0) nextSteps = vision.execution_strategy.short_term_steps;
  else if (vision.walk_it_out?.next_steps?.length > 0) nextSteps = vision.walk_it_out.next_steps;
  else if (vision.expected_impact?.length > 0) nextSteps = vision.expected_impact;
  else if (vision.desiredOutcomes?.length > 0) nextSteps = vision.desiredOutcomes;

  const longTerm: string[] = vision.execution_strategy?.long_term_stewardship || vision.walk_it_out?.weekly_practices || [];
  const risks: string[] = vision.risks_and_discernment || [];
  const futurePicture: string[] = vision.visualize?.future_picture || vision.objectives?.kingdom_purpose || [];
  const impactTargets = vision.impact_targets || null;
  const lifeContext = vision.life_context || null;
  const resourceManagement: string = vision.execution_strategy?.resource_management || '';
  const year = vision.metadata?.year || new Date().getFullYear();

  // ─── HTML ─────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 794px; background: #F9F7F4; color: #111; }
  .page {
    width: 794px;
    min-height: 1123px;
    background: #F9F7F4;
    padding: 56px 68px 48px;
    display: flex;
    flex-direction: column;
  }
  .page-dark { background: #111; color: #fff; }

  /* Logo — Playfair Display, same size as tagline area, not bold */
  .logo {
    font-family: 'Playfair Display', serif;
    font-size: 48px;
    font-weight: 400;
    letter-spacing: 1px;
    color: #111;
    line-height: 1.2;
    display: block;
  }
  .logo-dark { color: #fff; }
  .tagline {
    font-family: 'Lato', sans-serif;
    font-size: 11px;
    letter-spacing: 5px;
    color: #aaa;
    text-transform: uppercase;
    margin-top: 6px;
    margin-bottom: 12px;
    display: block;
  }
  .divider { height: 0.5px; background: #c8c4be; margin: 14px 0; }
  .divider-dark { background: #333; }
  .doc-label {
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    letter-spacing: 3px;
    color: #bbb;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 40px;
  }

  h1.title {
    font-family: 'Playfair Display', serif;
    font-size: 38px;
    font-weight: 400;
    line-height: 1.25;
    color: #111;
    margin-bottom: 10px;
  }
  .subtitle {
    font-family: 'Lato', sans-serif;
    font-size: 11px;
    letter-spacing: 2px;
    color: #999;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .summary {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-style: italic;
    color: #555;
    line-height: 1.75;
    max-width: 560px;
  }
  .financial-goal {
    margin-top: 18px;
    padding: 12px 18px;
    border-left: 3px solid #111;
    background: #f0ede8;
  }
  .financial-goal-label {
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    letter-spacing: 2px;
    color: #888;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .financial-goal-text {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    color: #111;
  }

  .section { margin-bottom: 28px; }
  .section-label {
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    letter-spacing: 3.5px;
    color: #888;
    text-transform: uppercase;
    padding-bottom: 9px;
    border-bottom: 0.5px solid #c8c4be;
    margin-bottom: 16px;
  }
  .section-label-dark { color: #555; border-bottom-color: #333; }
  .body-text {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    line-height: 1.8;
    color: #333;
  }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }

  .scripture-item { padding-left: 11px; border-left: 1.5px solid #ddd; margin-bottom: 13px; }
  .scripture-text { font-family: 'Playfair Display', serif; font-size: 14px; font-style: italic; color: #333; line-height: 1.6; margin-bottom: 3px; }
  .scripture-ref { font-family: 'Lato', sans-serif; font-size: 10px; color: #aaa; letter-spacing: 0.5px; }

  .value-card { background: #f0ede8; padding: 11px 13px; border-radius: 2px; margin-bottom: 9px; }
  .value-title { font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700; color: #111; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 3px; }
  .value-desc { font-family: 'Playfair Display', serif; font-size: 13px; color: #555; line-height: 1.5; }

  .pillar-item { margin-bottom: 13px; padding-bottom: 13px; border-bottom: 0.5px solid #e8e4de; }
  .pillar-title { font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700; color: #111; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 3px; }
  .pillar-desc { font-family: 'Playfair Display', serif; font-size: 13px; color: #555; line-height: 1.5; }

  .model-card { background: #f0ede8; padding: 13px 15px; border-radius: 2px; }
  .model-name { font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700; color: #111; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 3px; }
  .model-attr { font-family: 'Playfair Display', serif; font-size: 13px; font-style: normal; color: #555; line-height: 1.5; }

  .bullet-item { display: flex; gap: 9px; margin-bottom: 8px; }
  .bullet-dot { color: #bbb; font-size: 15px; line-height: 1.3; min-width: 9px; }
  .bullet-text { font-family: 'Playfair Display', serif; font-size: 14px; color: #333; line-height: 1.6; }

  .numbered-item { display: flex; gap: 13px; margin-bottom: 10px; align-items: flex-start; }
  .numbered-num { font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; color: #bbb; min-width: 15px; padding-top: 2px; }
  .numbered-text { font-family: 'Playfair Display', serif; font-size: 14px; color: #333; line-height: 1.6; }

  .context-item { margin-bottom: 13px; }
  .context-label { font-family: 'Lato', sans-serif; font-size: 10px; letter-spacing: 2px; color: #888; margin-bottom: 3px; text-transform: uppercase; }
  .context-text { font-family: 'Playfair Display', serif; font-size: 14px; color: #333; line-height: 1.6; }
  .resource-box { background: #f0ede8; padding: 13px 15px; border-radius: 2px; margin-top: 14px; }

  .impact-label { font-family: 'Lato', sans-serif; font-size: 10px; letter-spacing: 2px; color: #888; text-transform: uppercase; margin-bottom: 5px; }
  .impact-text { font-family: 'Playfair Display', serif; font-size: 14px; color: #333; line-height: 1.6; }

  /* Declarations — dark page */
  .declarations-label { font-family: 'Lato', sans-serif; font-size: 10px; letter-spacing: 4px; color: #555; text-transform: uppercase; text-align: center; margin-bottom: 16px; }
  .declaration-item { text-align: center; margin-bottom: 26px; }
  .declaration-text { font-family: 'Playfair Display', serif; font-size: 17px; font-style: italic; font-weight: 400; color: #fff; line-height: 1.8; }

  /* Prayer */
  .prayer-text { font-family: 'Playfair Display', serif; font-size: 15px; font-style: italic; color: #444; line-height: 1.9; }
  .reflection-item { font-family: 'Playfair Display', serif; font-size: 14px; font-style: italic; color: #444; line-height: 1.65; padding-left: 11px; border-left: 1.5px solid #c8c4be; margin-bottom: 13px; }

  .footer { margin-top: auto; padding-top: 13px; border-top: 0.5px solid #c8c4be; display: flex; justify-content: space-between; align-items: center; }
  .footer-dark { border-top-color: #333; }
  .footer-text { font-family: 'Lato', sans-serif; font-size: 9px; letter-spacing: 2px; color: #bbb; text-transform: uppercase; }
  .footer-text-dark { color: #444; }
</style>
</head>
<body>

<!-- PAGE 1: COVER -->
<div class="page">
  <div style="text-align:center; margin-bottom:14px;">
    <div class="logo">Hazon</div>
    <div class="tagline" style="text-align:center; margin-top:14px; margin-bottom:12px;">A CLEAR VISION.</div>
  </div>
  <div class="divider" style="margin-top:0; margin-bottom:14px;"></div>
  <div class="doc-label">A Hazon Alignment Document</div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding-bottom:36px;">
    <h1 class="title">${title}</h1>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    ${summary ? `<p class="summary">${summary}</p>` : ''}
    ${financialGoal ? `
    <div class="financial-goal">
      <div class="financial-goal-label">Financial Goal</div>
      <div class="financial-goal-text">${financialGoal}</div>
    </div>` : ''}
  </div>

  <div class="footer">
    <span class="footer-text">Hazon | A Clear Vision</span>
    <span class="footer-text">${year}</span>
  </div>
</div>

<!-- PAGE 2: MANDATE + BIBLE FOUNDATION + BIBLICAL MODELS -->
<div class="page">
  ${mandate ? `
  <div class="section">
    <div class="section-label">MANDATE</div>
    <p class="body-text">${mandate}</p>
  </div>` : ''}

  ${biblicalFoundation.length > 0 ? `
  <div class="section">
    <div class="section-label">BIBLICAL FOUNDATION</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 24px;">
      ${biblicalFoundation.map(b => `
        <div style="padding-left:12px;border-left:2px solid #c8c4be;">
          ${b.scripture ? `<span style="font-family:'Lato',sans-serif;font-size:9px;letter-spacing:2px;color:#aaa;text-transform:uppercase;">${b.scripture}</span><br>` : ''}
          ${b.theme ? `<p style="font-family:'Playfair Display',serif;font-size:12px;font-style:italic;color:#333;line-height:1.6;margin-top:2px;margin-bottom:${b.explanation ? '4px' : '0'};">"${b.theme}"</p>` : ''}
          ${b.explanation ? `<p style="font-family:'Lato',sans-serif;font-weight:400;font-style:normal;font-size:11px;color:#555;line-height:1.55;">${b.explanation}</p>` : ''}
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  ${biblicalModels.length > 0 ? `
  <div class="section">
    <div class="section-label">BIBLICAL MODELS</div>
    <div class="two-col" style="gap:16px;">
      ${biblicalModels.map((m: any) => `
        <div class="model-card" style="padding:11px 13px;">
          <div class="model-name">${m.figure}</div>
          <div class="model-attr">${m.attribute}</div>
          ${m.vision_connection ? `<div style="font-family:'Playfair Display',serif;font-size:11px;font-style:italic;color:#555;line-height:1.5;border-top:0.5px solid #ddd;padding-top:5px;">${m.vision_connection}</div>` : ''}
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  <div class="footer">
    <span class="footer-text">Hazon | A Clear Vision</span>
    <span class="footer-text">${year}</span>
  </div>
</div>

<!-- PAGE 3: CORE VALUES + PILLARS + IMPACT + KINGDOM PURPOSE -->
<div class="page">
  <div class="two-col section">
    ${coreValues.length > 0 ? `
    <div>
      <div class="section-label">CORE VALUES</div>
      ${coreValues.map((v: any) => `
        <div class="value-card">
          <div class="value-title">${typeof v === 'string' ? v : v.value}</div>
          ${(typeof v !== 'string' && v.description) ? `<div class="value-desc">${v.description}</div>` : ''}
        </div>
      `).join('')}
    </div>` : '<div></div>'}

    ${strategicPillars.length > 0 ? `
    <div>
      <div class="section-label">STRATEGIC PILLARS</div>
      ${strategicPillars.map((p: any) => `
        <div class="pillar-item">
          <div class="pillar-title">${typeof p === 'string' ? p : p.pillar}</div>
          ${(typeof p !== 'string' && p.description) ? `<div class="pillar-desc">${p.description}</div>` : ''}
        </div>
      `).join('')}
    </div>` : ''}
  </div>

  ${impactTargets ? `
  <div class="section">
    <div class="section-label">TARGET IMPACT</div>
    <div class="three-col">
      ${impactTargets.individual ? `<div><div class="impact-label">Individual</div><div class="impact-text">${impactTargets.individual}</div></div>` : ''}
      ${impactTargets.community ? `<div><div class="impact-label">Community</div><div class="impact-text">${impactTargets.community}</div></div>` : ''}
      ${impactTargets.generational ? `<div><div class="impact-label">Generational</div><div class="impact-text">${impactTargets.generational}</div></div>` : ''}
    </div>
  </div>` : ''}

  ${futurePicture.length > 0 ? `
  <div class="section">
    <div class="section-label">KINGDOM PURPOSE</div>
    <div class="two-col">
      ${futurePicture.map((item: string) => `
        <div class="bullet-item">
          <span class="bullet-dot">•</span>
          <span class="bullet-text">${item}</span>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  <div class="footer">
    <span class="footer-text">Hazon | A Clear Vision</span>
    <span class="footer-text">${year}</span>
  </div>
</div>

<!-- PAGE 4: LIFE CONTEXT + EXECUTION + RISKS -->
${(lifeContext || longTerm.length > 0 || risks.length > 0 || resourceManagement) ? `
<div class="page">
  ${lifeContext ? `
  <div class="two-col section">
    <div>
      <div class="section-label">LIFE CONTEXT</div>
      ${lifeContext.location ? `<div class="context-item"><div class="context-label">Location</div><div class="context-text">${lifeContext.location}</div></div>` : ''}
      ${lifeContext.culture ? `<div class="context-item"><div class="context-label">Culture</div><div class="context-text">${lifeContext.culture}</div></div>` : ''}
      ${lifeContext.timing ? `<div class="context-item"><div class="context-label">Timing</div><div class="context-text">${lifeContext.timing}</div></div>` : ''}
      ${lifeContext.constraints ? `<div class="context-item"><div class="context-label">Constraints</div><div class="context-text">${lifeContext.constraints}</div></div>` : ''}
    </div>
    <div>
      ${longTerm.length > 0 ? `
      <div class="section-label">LONG-TERM STEWARDSHIP</div>
      ${longTerm.map((item: string) => `
        <div class="bullet-item">
          <span class="bullet-dot">•</span>
          <span class="bullet-text">${item}</span>
        </div>
      `).join('')}` : ''}
      ${resourceManagement ? `
      <div class="resource-box" style="margin-top:${longTerm.length > 0 ? '16px' : '0'};">
        <div class="context-label" style="margin-bottom:5px;">Resource Management</div>
        <div class="context-text">${resourceManagement}</div>
      </div>` : ''}
    </div>
  </div>` : ''}

  ${risks.length > 0 ? `
  <div class="section">
    <div class="section-label">RISKS & DISCERNMENT NOTES</div>
    <div class="two-col">
      ${risks.map((item: string) => `
        <div class="bullet-item">
          <span class="bullet-dot">•</span>
          <span class="bullet-text">${item}</span>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  <div class="footer">
    <span class="footer-text">Hazon | A Clear Vision</span>
    <span class="footer-text">${year}</span>
  </div>
</div>` : ''}

<!-- PAGE 5: DECLARATIONS (dark) -->
${declarations.length > 0 ? `
<div class="page page-dark">
  <div style="text-align:center; margin-bottom:10px;">
    <div class="logo logo-dark">Hazon</div>
    <div class="tagline">A Clear Vision.</div>
  </div>
  <div class="divider divider-dark"></div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <div class="declarations-label">Declarations</div>
    ${declarations.map((d: string) => `
      <div class="declaration-item">
        <p class="declaration-text">"${d}"</p>
      </div>
    `).join('')}
  </div>
  </div>

  <div class="footer footer-dark">
    <span class="footer-text footer-text-dark">Hazon | A Clear Vision</span>
    <span class="footer-text footer-text-dark">${year}</span>
  </div>
</div>` : ''}

<!-- PAGE 6: PRAYER (own page, larger font) -->
${prayer ? `
<div class="page">
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding: 20px 0;">
    <div class="section-label" style="margin-bottom:28px;">PRAYER OF SURRENDER</div>
    <p style="font-family:'Playfair Display',serif;font-size:18px;font-style:italic;color:#333;line-height:2.1;max-width:580px;">${prayer}</p>
  </div>
  <div class="footer">
    <span class="footer-text">Hazon | A Clear Vision</span>
    <span class="footer-text">${year}</span>
  </div>
</div>` : ''}

<!-- PAGE 7: REFLECTION PROMPTS (own page, after prayer) -->
${reflectionPrompts.length > 0 ? `
<div class="page">
  <div style="flex:1; display:flex; flex-direction:column; padding: 10px 0;">
    <div class="section" style="margin-bottom:36px;">
      <div class="section-label" style="margin-bottom:20px;">REFLECTION PROMPTS</div>
      ${reflectionPrompts.map((r: string) => `
        <p class="reflection-item" style="font-size:15px; margin-bottom:16px;">${r}</p>
      `).join('')}
    </div>
  </div>
  <div class="footer">
    <span class="footer-text">Hazon | A Clear Vision</span>
    <span class="footer-text">${year}</span>
  </div>
</div>` : ''}


<!-- PAGE 7: NEXT STEPS — ALWAYS LAST -->
${nextSteps.length > 0 ? `
<div class="page">
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding: 20px 0;">
    <div class="section-label" style="margin-bottom:24px;">NEXT STEPS</div>
    ${nextSteps.map((item: string, idx: number) => `
      <div class="numbered-item" style="margin-bottom:18px;">
        <span class="numbered-num" style="font-size:15px; color:#111; min-width:24px;">${idx + 1}</span>
        <span class="numbered-text" style="font-size:15px;">${item}</span>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <span class="footer-text">Hazon | A Clear Vision</span>
    <span class="footer-text">${year}</span>
  </div>
</div>` : ''}

</body>
</html>`;

  // ─── RENDER ───────────────────────────────────────────────
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-99999px;left:-99999px;width:794px;';
  container.innerHTML = html;
  document.body.appendChild(container);

  // Wait for fonts to load
  await new Promise(resolve => setTimeout(resolve, 1800));

  const pages = container.querySelectorAll('.page');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i] as HTMLElement;
    const isDark = page.classList.contains('page-dark');

    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: isDark ? '#111111' : '#F9F7F4',
      width: 794,
      windowWidth: 794,
    });

    if (i > 0) pdf.addPage();

    const imgData = canvas.toDataURL('image/jpeg', 0.97);
    const imgH = (canvas.height * pageW) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pageW, Math.min(imgH, pageH));
  }

  document.body.removeChild(container);

  const filename = `${(title || 'Hazon_Vision').replace(/[^a-z0-9]/gi, '_')}.pdf`;
  pdf.save(filename);
};