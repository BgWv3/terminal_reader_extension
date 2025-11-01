(function() {
  // --- 1. PREVENT SCRIPT FROM RUNNING TWICE ---
  if (document.getElementById('terminal-view-overlay')) {
    return;
  }

  // --- 2. CONTENT EXTRACTION (UPGRADED) ---

  /**
   * Finds the best candidate element for the main article body.
   * This is a multi-stage process.
   */
  function findArticleContainer() {
    
    // --- STAGE 1: Try specific, high-confidence selectors first ---
    // --- RE-ORDERED ---
    // Prioritize broad containers like 'article' FIRST. This helps
    // grab the parent of paginated content (Ars Technica) before
    // grabbing a child class like '.post-content' on page 1.
    const specificSelectors = [
      'article',              // Generic HTML5 tag
      '.article-content',    // Ars Technica
      '#storytext',          // NPR
      '.storytext',          // NPR
      'article.story',       // Other news sites
      '.entry-content',      // WordPress default
      '.post-content',       // Common blog class
      '.article-body',       // Common class
      '#main-content',       // Common accessibility ID
      '#article-body',       // Common ID
      '[role="main"]'        // Accessibility role
    ];

    for (const selector of specificSelectors) {
      const specificElement = document.querySelector(selector);
      
      // Check if it exists and has a decent amount of text
      if (specificElement && specificElement.innerText.length > 500) {
        
        // Check that it's not *just* a wrapper for other articles (e.g., a homepage)
        const nestedArticles = specificElement.querySelectorAll('article');
        if (nestedArticles.length > 3) {
          continue; // This is likely a list, not a single article
        }
        
        // Found a good candidate!
        return specificElement;
      }
    }

    // --- STAGE 2: Fallback to density heuristic if no specific selector works ---
    let bestCandidate = null;
    let maxScore = -1;

    // Check divs and main tags
    const candidates = document.querySelectorAll('div, main'); 

    candidates.forEach(element => {
        // Skip if it's clearly nav, footer, or sidebar
        const idAndClass = (element.id + element.className).toLowerCase();
        if (idAndClass.includes('nav') || idAndClass.includes('footer') || idAndClass.includes('sidebar') || idAndClass.includes('comment') || idAndClass.includes('header') || idAndClass.includes('menu')) {
            return;
        }
        
        // Don't select an element that is *inside* a known good tag
        if (element.closest('article, main')) {
            if (!element.tagName.match(/^(ARTICLE|MAIN)$/i)) return;
        }
        
        // Don't select tiny containers
        if (element.clientHeight < 300) {
            return;
        }

        const paragraphs = element.querySelectorAll('p');
        const pCount = paragraphs.length;

        // Needs at least 3 paragraphs to be considered
        if (pCount < 3) { 
            return; 
        }

        const linkCount = element.querySelectorAll('a').length;
        const textLength = element.innerText.length;

        // Score based on p-count and text length, penalize links
        let score = (pCount * 20) + (textLength / 10);
        
        // Heavy penalty for having more links than paragraphs
        if (linkCount > pCount) {
           score = score / (linkCount - pCount + 1);
        }

        if (score > maxScore) {
          maxScore = score;
          bestCandidate = element;
        }
    });
    
    // --- STAGE 3: Final fallback ---
    return bestCandidate || document.body;
  }

  /** Gets the article title. */
  function getArticleTitle() {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) {
      return ogTitle.content;
    }
    const h1 = document.querySelector('h1');
    if (h1 && h1.innerText) {
      return h1.innerText;
    }
    return document.title || 'NO_TITLE_DETECTED';
  }

  /** Gets the article author. */
  function getArticleAuthor() {
    const metaAuthor = document.querySelector('meta[name="author"]');
    if (metaAuthor && metaAuthor.content) {
      return metaAuthor.content;
    }
    const byline = document.querySelector('.byline, .author, *[rel="author"], .author-name');
    if (byline && byline.innerText) {
      return byline.innerText.replace(/by/i, '').trim();
    }
    return null;
  }
  
  // --- 3. BUILD THE TERMINAL OVERLAY ---
  const overlay = document.createElement('div');
  overlay.id = 'terminal-view-overlay';

  const exitButton = document.createElement('button');
  exitButton.id = 'terminal-exit-btn';
  exitButton.innerText = '[X] CLOSE';
  exitButton.onclick = () => {
    overlay.remove();
    document.body.style.overflow = 'auto'; 
  };

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'terminal-content';

  // --- 4. POPULATE CONTENT ---
  const title = getArticleTitle();
  const titleEl = document.createElement('h1');
  titleEl.textContent = `> LOAD_DATA: "${title}"`;
  contentWrapper.appendChild(titleEl);

  const author = getArticleAuthor();
  if (author) {
    const authorEl = document.createElement('p');
    authorEl.className = 'byline';
    authorEl.textContent = `//_SOURCE_ACKNOWLEDGED: "${author}"`;
    contentWrapper.appendChild(authorEl);
  }

  // Get and clone the main content
  const articleBody = findArticleContainer();
  
  // We only want specific elements. Query for them.
  const contentNodes = articleBody.querySelectorAll('p, h2, h3, h4, img, pre, ul, ol, blockquote');
  
  contentNodes.forEach(node => { // 'node' is the ORIGINAL, live element

    // --- NEW "SMART" VISIBILITY CHECK (v2) ---
    // This fixes The Verge regression.
    // .closest() checks the node *and its parents* for a match.
    // This finds junk text where the hidden class is on a parent.
    const junkSelectors = '.sr-only, .visually-hidden, .screen-reader-text, [aria-hidden="true"], .ad, .advertisement, footer, .footer, .comments, #comments, .related-posts, .author-bio, .social-links';
    if (node.closest(junkSelectors)) {
      return; // Skip this node
    }
    // --- END NEW CHECK ---
    
    const clonedNode = node.cloneNode(true);
    
    if (clonedNode.tagName) {
      const tagName = clonedNode.tagName.toLowerCase();

      if (tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
        clonedNode.textContent = `-> ${clonedNode.textContent}`;
      }
      
      // --- NEW LINK FORMATTING ---
      if (tagName === 'a') {
        clonedNode.textContent = `[${clonedNode.textContent}]`;
        clonedNode.setAttribute('title', clonedNode.href); // Add href for hover
      }
      
      // --- NEW LINK FORMATTING (inside other elements) ---
      clonedNode.querySelectorAll('a').forEach(a => {
         a.textContent = `[${a.textContent}]`;
         a.setAttribute('title', a.href); // Add href for hover
      });

      // --- IMAGE HANDLING ---
      if (tagName === 'img') {
        
        // --- We KEEP the image size check ---
        // We also check the parent here for ad-related containers
        if (!node.getAttribute('src') || node.naturalWidth < 100 || node.naturalHeight < 100 || node.offsetWidth < 50 || node.closest('.ad, .advertisement')) {
          return; // It's a tracking pixel, icon, or tiny spacer. Skip it.
        }
        // --- END IMAGE CHECK ---

        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'terminal-image-wrapper';
        imgWrapper.appendChild(clonedNode);
        contentWrapper.appendChild(imgWrapper);
        return; // Skip appending clonedNode directly
      }
    }

    contentWrapper.appendChild(clonedNode);
  });
  
  // Add the blinking cursor at the end
  const cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';
  cursor.textContent = '_';
  contentWrapper.appendChild(cursor);

  // --- 5. ASSEMBLE AND INJECT ---
  overlay.appendChild(exitButton);
  overlay.appendChild(contentWrapper);
  document.body.appendChild(overlay);
  
  document.body.style.overflow = 'hidden';

})();


