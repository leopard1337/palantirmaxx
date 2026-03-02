const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  console.log('Step 1: Navigating to localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Close any open drawers
  await page.keyboard.press('Escape');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('Step 2: Taking initial screenshot...');
  await page.screenshot({ 
    path: 'screenshots/state-1-initial.png', 
    fullPage: false 
  });
  
  // Check for empty panels
  const hasEmptyPanels = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some(btn => btn.textContent.includes('Add Widget'));
  });
  
  console.log(`Has empty panels: ${hasEmptyPanels}`);
  
  if (hasEmptyPanels) {
    console.log('\nStep 3: Filling empty panels with widgets...');
    
    const widgetsToAdd = [
      'All Feed',
      'Events',
      'Top Movers',
      'Markets',
      'Flight Tracker'
    ];
    
    for (const widgetName of widgetsToAdd) {
      // Check if there's still an empty panel
      const stillEmpty = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent.includes('Add Widget'));
      });
      
      if (!stillEmpty) {
        console.log('All panels filled!');
        break;
      }
      
      console.log(`\n  Adding: ${widgetName}`);
      
      // Click Add Widget button
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(btn => btn.textContent.includes('Add Widget'));
        if (addBtn) {
          addBtn.click();
          return true;
        }
        return false;
      });
      
      if (!clicked) {
        console.log('  No more empty panels');
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Select widget from menu
      const selected = await page.evaluate((name) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const widgetBtn = buttons.find(btn => {
          const text = btn.textContent;
          if (name === 'All Feed' && text.includes('All')) return true;
          if (name === 'Flight Tracker' && text.includes('Flight')) return true;
          if (name === 'Top Movers' && text.includes('Movers')) return true;
          return text.includes(name);
        });
        
        if (widgetBtn) {
          widgetBtn.click();
          return true;
        }
        return false;
      }, widgetName);
      
      if (selected) {
        console.log(`  ✓ Added ${widgetName}`);
      } else {
        console.log(`  ✗ Could not find ${widgetName}`);
        await page.keyboard.press('Escape');
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  } else {
    console.log('\nStep 3: All panels already filled');
  }
  
  console.log('\nStep 4: Waiting for data to load...');
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  console.log('Step 5: Taking screenshot with all widgets loaded...');
  await page.screenshot({ 
    path: 'screenshots/state-2-all-loaded.png', 
    fullPage: false 
  });
  
  console.log('\nStep 6: Analyzing item heights across all widgets...');
  
  const heightAnalysis = await page.evaluate(() => {
    const results = [];
    
    // Find all panels with widgets
    const allDivs = Array.from(document.querySelectorAll('div'));
    const panels = allDivs.filter(div => {
      const classes = div.className || '';
      return classes.includes('rounded-xl') && 
             classes.includes('border') && 
             classes.includes('flex-col') &&
             classes.includes('bg-zinc');
    });
    
    panels.forEach((panel, panelIdx) => {
      // Get widget name from header
      let widgetName = 'Unknown';
      const headerSpans = panel.querySelectorAll('span');
      for (const span of headerSpans) {
        const text = span.textContent.trim();
        if (text && text.length > 2 && text.length < 30 && !text.includes('•')) {
          // Check if it looks like a widget name
          if (['All', 'Feed', 'Events', 'Markets', 'Movers', 'Flight', 'Tracker'].some(word => text.includes(word))) {
            widgetName = text;
            break;
          }
        }
      }
      
      // Find list items within this panel
      const items = Array.from(panel.querySelectorAll('button, a'))
        .filter(el => {
          const classes = el.className || '';
          return (classes.includes('px-') && classes.includes('py-') && classes.includes('border-b'));
        })
        .filter(el => {
          // Make sure it belongs to this panel
          return el.closest('div[class*="rounded-xl"]') === panel;
        });
      
      if (items.length === 0) {
        results.push({
          panelIndex: panelIdx,
          widgetName,
          itemCount: 0,
          heights: [],
          avgHeight: 0
        });
        return;
      }
      
      // Measure heights of first 5 items
      const heights = items.slice(0, 5).map(item => {
        const rect = item.getBoundingClientRect();
        return Math.round(rect.height * 10) / 10; // Round to 1 decimal
      });
      
      const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
      
      // Get detailed info about first item
      const firstItem = items[0];
      const styles = window.getComputedStyle(firstItem);
      
      // Count text rows in first item
      const textElements = Array.from(firstItem.querySelectorAll('p, span'))
        .filter(el => el.textContent.trim().length > 3);
      
      results.push({
        panelIndex: panelIdx,
        widgetName,
        itemCount: items.length,
        heights,
        avgHeight: Math.round(avgHeight * 10) / 10,
        minHeight: Math.min(...heights),
        maxHeight: Math.max(...heights),
        variation: Math.max(...heights) - Math.min(...heights),
        firstItemPadding: styles.padding,
        textElementCount: textElements.length
      });
    });
    
    return results;
  });
  
  fs.writeFileSync('height-comparison.json', JSON.stringify(heightAnalysis, null, 2));
  
  console.log('\n' + '='.repeat(90));
  console.log('WIDGET ITEM HEIGHT COMPARISON');
  console.log('='.repeat(90));
  
  heightAnalysis.forEach((widget, idx) => {
    console.log(`\n${idx + 1}. ${widget.widgetName}`);
    console.log('   ' + '-'.repeat(86));
    
    if (widget.itemCount > 0) {
      console.log(`   Items:          ${widget.itemCount}`);
      console.log(`   Average Height: ${widget.avgHeight.toFixed(1)}px`);
      console.log(`   Height Range:   ${widget.minHeight.toFixed(1)}px - ${widget.maxHeight.toFixed(1)}px`);
      console.log(`   Variation:      ${widget.variation.toFixed(1)}px`);
      console.log(`   Sample Heights: [${widget.heights.map(h => h.toFixed(1)).join('px, ')}px]`);
      console.log(`   Padding:        ${widget.firstItemPadding}`);
      console.log(`   Text Elements:  ${widget.textElementCount}`);
    } else {
      console.log('   No items loaded');
    }
  });
  
  console.log('\n' + '='.repeat(90));
  console.log('CONSISTENCY ANALYSIS');
  console.log('='.repeat(90));
  
  const loaded = heightAnalysis.filter(w => w.itemCount > 0);
  
  if (loaded.length > 0) {
    const allHeights = loaded.map(w => w.avgHeight);
    const minAvg = Math.min(...allHeights);
    const maxAvg = Math.max(...allHeights);
    const difference = maxAvg - minAvg;
    
    console.log(`\nAverage heights across widgets: ${allHeights.map(h => h.toFixed(1)).join('px, ')}px`);
    console.log(`Range: ${minAvg.toFixed(1)}px to ${maxAvg.toFixed(1)}px`);
    console.log(`Difference: ${difference.toFixed(1)}px`);
    
    if (difference < 5) {
      console.log('\n✓ CONSISTENT: All widgets have similar item heights (within 5px)');
    } else if (difference < 10) {
      console.log('\n⚠ MOSTLY CONSISTENT: Minor height differences (5-10px variation)');
    } else {
      console.log('\n✗ INCONSISTENT: Significant height differences (>10px variation)');
    }
    
    // Identify outliers
    console.log('\nWidget-by-widget assessment:');
    loaded.forEach(widget => {
      const diff = Math.abs(widget.avgHeight - minAvg);
      if (diff < 3) {
        console.log(`  ✓ ${widget.widgetName.padEnd(20)} - Consistent`);
      } else if (diff < 8) {
        console.log(`  ~ ${widget.widgetName.padEnd(20)} - Slight difference (+${diff.toFixed(1)}px)`);
      } else {
        console.log(`  ✗ ${widget.widgetName.padEnd(20)} - Inconsistent (+${diff.toFixed(1)}px)`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(90));
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
  
  console.log('\n✓ Analysis complete!');
  console.log('  - Screenshots: state-1-initial.png, state-2-all-loaded.png');
  console.log('  - Data: height-comparison.json');
})();
