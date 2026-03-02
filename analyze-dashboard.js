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
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('Step 2: Taking initial screenshot...');
  await page.screenshot({ 
    path: 'screenshots/step1-initial.png', 
    fullPage: false 
  });
  
  // Check current state of panels
  const panelState = await page.evaluate(() => {
    const panels = [];
    const allButtons = Array.from(document.querySelectorAll('button'));
    const addWidgetButtons = allButtons.filter(btn => btn.textContent.includes('Add Widget'));
    
    // Find all panel containers
    const panelContainers = Array.from(document.querySelectorAll('[class*="rounded-xl"][class*="border"]'));
    
    return {
      totalPanels: panelContainers.length,
      emptyPanels: addWidgetButtons.length,
      hasAddButtons: addWidgetButtons.length > 0
    };
  });
  
  console.log(`Found ${panelState.totalPanels} total panels`);
  console.log(`Found ${panelState.emptyPanels} empty panels`);
  
  // Define widgets to add
  const widgetsToAdd = [
    'All Feed',
    'Events',
    'Top Movers',
    'Markets',
    'Flight Tracker'
  ];
  
  // If there are empty panels, fill them
  if (panelState.emptyPanels > 0) {
    console.log('\nStep 3: Filling empty panels...');
    
    for (let i = 0; i < Math.min(widgetsToAdd.length, panelState.emptyPanels); i++) {
      const widgetName = widgetsToAdd[i];
      
      try {
        console.log(`\n  Adding widget ${i + 1}: ${widgetName}`);
        
        // Click "Add Widget" button
        const addClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const addBtn = buttons.find(btn => btn.textContent.includes('Add Widget'));
          if (addBtn) {
            addBtn.click();
            return true;
          }
          return false;
        });
        
        if (!addClicked) {
          console.log(`  ❌ Could not find Add Widget button`);
          break;
        }
        
        // Wait for selector to appear
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Click the widget in the selector
        const widgetClicked = await page.evaluate((name) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          
          // Try to find by exact text match in button or child elements
          const widgetBtn = buttons.find(btn => {
            const text = btn.textContent;
            const hasMatch = text.includes(name);
            
            // Special case matching
            if (name === 'All Feed' && (text.includes('All Feed') || text.includes('All Signals'))) return true;
            if (name === 'Flight Tracker' && text.includes('Flight')) return true;
            if (name === 'Top Movers' && text.includes('Movers')) return true;
            
            return hasMatch;
          });
          
          if (widgetBtn) {
            widgetBtn.click();
            return true;
          }
          return false;
        }, widgetName);
        
        if (widgetClicked) {
          console.log(`  ✓ Successfully added: ${widgetName}`);
          await new Promise(resolve => setTimeout(resolve, 1200));
        } else {
          console.log(`  ❌ Could not find widget: ${widgetName}`);
          // Close selector if open
          await page.keyboard.press('Escape');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
  } else {
    console.log('\nStep 3: All panels already filled, skipping...');
  }
  
  console.log('\nStep 4: Taking final screenshot with all widgets...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ 
    path: 'screenshots/step2-all-filled.png', 
    fullPage: false 
  });
  
  console.log('\nStep 5: Analyzing widget item styling...');
  
  // Extract detailed styling from items in each widget
  const itemAnalysis = await page.evaluate(() => {
    const results = [];
    
    // Find all widget panels
    const panels = Array.from(document.querySelectorAll('[class*="rounded-xl"][class*="border"]'));
    
    panels.forEach((panel, panelIndex) => {
      // Get widget title from header
      const header = panel.querySelector('[class*="border-b"]');
      const titleEl = header?.querySelector('span[class*="text-"]');
      const widgetName = titleEl?.textContent?.trim() || `Panel ${panelIndex + 1}`;
      
      // Find items within this panel (buttons or links that are list items)
      const items = Array.from(panel.querySelectorAll('button[class*="px-"], a[class*="px-"]'))
        .filter(el => el.closest('[class*="rounded-xl"]') === panel);
      
      if (items.length === 0) {
        results.push({
          panelIndex,
          widgetName,
          itemCount: 0,
          items: []
        });
        return;
      }
      
      // Analyze first 3 items
      const itemStyles = items.slice(0, 3).map((item, itemIndex) => {
        const styles = window.getComputedStyle(item);
        
        // Find text elements
        const textElements = Array.from(item.querySelectorAll('p, span'))
          .filter(el => el.textContent.trim().length > 5);
        
        return {
          itemIndex,
          className: item.className,
          padding: styles.padding,
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom,
          paddingLeft: styles.paddingLeft,
          paddingRight: styles.paddingRight,
          height: styles.height,
          minHeight: styles.minHeight,
          border: styles.border,
          borderBottom: styles.borderBottom,
          background: styles.backgroundColor,
          display: styles.display,
          gap: styles.gap,
          // Get actual dimensions
          computedHeight: item.getBoundingClientRect().height,
          computedWidth: item.getBoundingClientRect().width,
          // Text styling
          textElements: textElements.slice(0, 2).map(el => {
            const s = window.getComputedStyle(el);
            return {
              tag: el.tagName.toLowerCase(),
              fontSize: s.fontSize,
              lineHeight: s.lineHeight,
              fontWeight: s.fontWeight,
              color: s.color,
              text: el.textContent.substring(0, 50)
            };
          })
        };
      });
      
      results.push({
        panelIndex,
        widgetName,
        itemCount: items.length,
        items: itemStyles
      });
    });
    
    return results;
  });
  
  fs.writeFileSync('widget-item-analysis.json', JSON.stringify(itemAnalysis, null, 2));
  console.log('✓ Analysis saved to widget-item-analysis.json');
  
  // Create a comparison summary
  console.log('\n=== VISUAL CONSISTENCY ANALYSIS ===\n');
  
  itemAnalysis.forEach((panel, idx) => {
    console.log(`${idx + 1}. ${panel.widgetName} (${panel.itemCount} items)`);
    if (panel.items.length > 0) {
      const firstItem = panel.items[0];
      console.log(`   Height: ${firstItem.computedHeight.toFixed(1)}px`);
      console.log(`   Padding: ${firstItem.padding}`);
      console.log(`   Border: ${firstItem.borderBottom}`);
      if (firstItem.textElements.length > 0) {
        console.log(`   Text size: ${firstItem.textElements[0].fontSize}`);
      }
    }
    console.log('');
  });
  
  // Keep browser open briefly
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await browser.close();
  console.log('\n✓ Done! Check screenshots folder for images.');
})();
