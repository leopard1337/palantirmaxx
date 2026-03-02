const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Show browser so we can see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  console.log('Navigating to localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Taking initial dashboard screenshot...');
  await page.screenshot({ 
    path: 'screenshots/dashboard-initial.png', 
    fullPage: false 
  });
  
  // Find all "Add Widget" buttons (empty panels)
  console.log('Looking for empty panels...');
  
  // Try a more specific selector
  const emptyPanels = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addWidgetButtons = buttons.filter(btn => 
      btn.textContent.includes('Add Widget') || 
      btn.closest('[class*="panel"]')?.querySelector('svg[class*="plus"]')
    );
    return addWidgetButtons.length;
  });
  
  console.log(`Found ${emptyPanels} empty panels`);
  
  // Widget types to add in order
  const widgetsToAdd = [
    'All Feed',
    'Events', 
    'Markets',
    'Top Movers',
    'Flight Tracker'
  ];
  
  // Function to click add button and select widget
  async function addWidget(widgetName) {
    try {
      console.log(`\nAttempting to add widget: ${widgetName}`);
      
      // Find and click an "Add Widget" button
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
        console.log('Could not find Add Widget button');
        return false;
      }
      
      // Wait for widget selector to appear
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Take screenshot of widget selector
      await page.screenshot({ 
        path: `screenshots/widget-selector-${widgetName.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: false
      });
      
      // Click the widget option
      const selected = await page.evaluate((name) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const widgetBtn = buttons.find(btn => 
          btn.textContent.includes(name) || 
          btn.querySelector('p')?.textContent.includes(name)
        );
        if (widgetBtn) {
          widgetBtn.click();
          return true;
        }
        return false;
      }, widgetName);
      
      if (!selected) {
        console.log(`Could not find widget option: ${widgetName}`);
        // Try to close the selector
        await page.keyboard.press('Escape');
        return false;
      }
      
      console.log(`Successfully added: ${widgetName}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
      
    } catch (err) {
      console.log(`Error adding widget ${widgetName}: ${err.message}`);
      return false;
    }
  }
  
  // Try to add each widget
  for (const widgetName of widgetsToAdd) {
    const success = await addWidget(widgetName);
    if (!success) {
      console.log(`Skipping ${widgetName}, moving to next...`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Take final screenshot with all widgets
  console.log('\nTaking final screenshot with all widgets...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ 
    path: 'screenshots/dashboard-all-widgets.png', 
    fullPage: false 
  });
  
  // Also take a full page screenshot
  await page.screenshot({ 
    path: 'screenshots/dashboard-all-widgets-full.png', 
    fullPage: true 
  });
  
  // Extract styling information from each widget panel
  console.log('\nExtracting widget panel styles...');
  const panelStyles = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll('[class*="panel"], [class*="widget"]'));
    return panels.slice(0, 5).map((panel, i) => {
      const styles = window.getComputedStyle(panel);
      const header = panel.querySelector('[class*="header"]');
      const headerStyles = header ? window.getComputedStyle(header) : null;
      
      return {
        index: i,
        className: panel.className,
        background: styles.backgroundColor,
        border: styles.border,
        borderRadius: styles.borderRadius,
        padding: styles.padding,
        width: styles.width,
        height: styles.height,
        overflow: styles.overflow,
        header: headerStyles ? {
          background: headerStyles.backgroundColor,
          height: headerStyles.height,
          padding: headerStyles.padding,
          borderBottom: headerStyles.borderBottom
        } : null
      };
    });
  });
  
  fs.writeFileSync('dashboard-panel-analysis.json', JSON.stringify(panelStyles, null, 2));
  console.log('Panel analysis saved to dashboard-panel-analysis.json');
  
  console.log('\nDone! Screenshots saved:');
  console.log('- dashboard-initial.png');
  console.log('- dashboard-all-widgets.png');
  console.log('- dashboard-all-widgets-full.png');
  
  // Keep browser open for 5 seconds so you can see the result
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await browser.close();
})();
