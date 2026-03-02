const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  console.log('Loading dashboard...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Close any open drawers by pressing Escape
  await page.keyboard.press('Escape');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('Taking clean screenshot without drawers...');
  await page.screenshot({ 
    path: 'screenshots/dashboard-clean.png', 
    fullPage: false 
  });
  
  // More detailed analysis
  const analysis = await page.evaluate(() => {
    const widgets = [];
    
    // Find all widget panels - they have the widget header with title
    const allDivs = Array.from(document.querySelectorAll('div'));
    const panelDivs = allDivs.filter(div => {
      const classes = div.className || '';
      return classes.includes('rounded-xl') && classes.includes('border') && classes.includes('flex-col');
    });
    
    console.log('Found', panelDivs.length, 'panels');
    
    panelDivs.forEach((panel, idx) => {
      // Get widget name from header
      const headerSpans = panel.querySelectorAll('span[class*="text-[10px]"]');
      let widgetName = 'Unknown';
      for (const span of headerSpans) {
        const text = span.textContent.trim();
        if (text && text !== '' && !text.includes('•')) {
          widgetName = text;
          break;
        }
      }
      
      // Find all clickable items (buttons or links)
      const items = Array.from(panel.querySelectorAll('button, a'))
        .filter(el => {
          const classes = el.className || '';
          return classes.includes('px-') && classes.includes('py-') && classes.includes('border-b');
        });
      
      console.log(`Panel ${idx + 1} (${widgetName}): ${items.length} items`);
      
      const itemDetails = items.slice(0, 5).map((item, itemIdx) => {
        const styles = window.getComputedStyle(item);
        const rect = item.getBoundingClientRect();
        
        // Find all paragraphs and spans with text
        const texts = Array.from(item.querySelectorAll('p, span'))
          .map(el => {
            const s = window.getComputedStyle(el);
            const text = el.textContent.trim();
            if (text.length < 3) return null;
            return {
              tag: el.tagName,
              text: text.substring(0, 40),
              fontSize: s.fontSize,
              lineHeight: s.lineHeight,
              fontWeight: s.fontWeight,
              color: s.color
            };
          })
          .filter(t => t !== null)
          .slice(0, 3);
        
        return {
          index: itemIdx,
          height: rect.height,
          width: rect.width,
          padding: styles.padding,
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom,
          borderBottom: styles.borderBottom,
          backgroundColor: styles.backgroundColor,
          gap: styles.gap,
          texts
        };
      });
      
      widgets.push({
        panelIndex: idx,
        widgetName,
        itemCount: items.length,
        sampleItems: itemDetails
      });
    });
    
    return widgets;
  });
  
  fs.writeFileSync('detailed-analysis.json', JSON.stringify(analysis, null, 2));
  console.log('\nAnalysis saved to detailed-analysis.json\n');
  
  // Print comparison table
  console.log('='.repeat(80));
  console.log('WIDGET ITEM COMPARISON');
  console.log('='.repeat(80));
  
  analysis.forEach(widget => {
    console.log(`\n${widget.widgetName} (${widget.itemCount} items)`);
    console.log('-'.repeat(80));
    
    if (widget.sampleItems.length > 0) {
      const first = widget.sampleItems[0];
      console.log(`  Item Height:     ${first.height.toFixed(1)}px`);
      console.log(`  Padding:         ${first.padding}`);
      console.log(`  Padding Top:     ${first.paddingTop}`);
      console.log(`  Padding Bottom:  ${first.paddingBottom}`);
      console.log(`  Border Bottom:   ${first.borderBottom}`);
      console.log(`  Background:      ${first.backgroundColor}`);
      
      if (first.texts.length > 0) {
        console.log(`\n  Text Elements:`);
        first.texts.forEach((t, i) => {
          console.log(`    ${i + 1}. ${t.tag} - Size: ${t.fontSize}, Weight: ${t.fontWeight}`);
          console.log(`       "${t.text}"`);
        });
      }
    } else {
      console.log('  No items found');
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
  // Height comparison
  console.log('\nHEIGHT COMPARISON:');
  console.log('-'.repeat(80));
  analysis.forEach(w => {
    if (w.sampleItems.length > 0) {
      const heights = w.sampleItems.map(i => i.height.toFixed(1));
      console.log(`${w.widgetName.padEnd(20)} ${heights.join('px, ')}px`);
    }
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
  
  console.log('\n✓ Complete! Check screenshots/dashboard-clean.png');
})();
