document.addEventListener('DOMContentLoaded', () => {
  const activateButton = document.getElementById('activate-btn');

  activateButton.addEventListener('click', async () => {
    // Get the currently active tab
    const [tab] = await chrome.tabs.query({ 
      active: true, 
      currentWindow: true 
    });

    // 1. Inject the CSS file
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["style.css"]
    });

    // 2. Execute the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    // 3. Close the popup
    window.close();
  });
});