# Terminal View

A "reader mode" Chrome extension that reformats any web article into a clean, distraction-free, soft-green terminal view.

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## About This Project

The goal of this extension is to provide a clean, text-only reading experience by removing all clutter (navbars, ads, sidebars, footers) and restyling the core article content to look like a classic computer terminal.

This is a front-end-only project, built with pure JavaScript for DOM manipulation and CSS for styling. It does not use any AI services or external APIs.

## Intended Use

This tool is for anyone who finds modern web articles overwhelming due to animated ads, pop-ups, and distracting sidebars. It's built for:

* **Focused Reading:** Strips away everything but the article text, subheadings, and images so you can read without interruption.
* **Aesthetics:** Provides a clean, retro, and easy-on-the-eyes "soft green" terminal theme.
* **Simplicity:** Acts as a lightweight, on-demand "reader mode" for any site, especially those that don't offer one natively.

## How It Works

1.  When the user clicks the extension icon, the `popup.js` script injects `style.css` and `content.js` into the active tab.
2.  The `content.js` script immediately runs and performs two main tasks:
    * **Extraction:** It runs a heuristic to find the main article container. It first searches for common high-confidence IDs (like `#storytext` or `.entry-content`) and falls back to a density-based algorithm (scoring elements on paragraph count vs. link count) to find the best candidate.
    * **Injection:** It extracts the title, author, and all `p, h2, h3, img` tags from the-found container, builds a new full-screen `<div>` overlay, and injects the extracted content into it.
3.  The `style.css` file styles this new overlay with the classic soft-green terminal theme, including grayscale images and a blinking cursor.
4.  An `[X] CLOSE` button on the overlay allows the user to close the Terminal View and return to the original website.

## How to Install (Locally)

Since this extension is not on the Chrome Web Store, you must load it locally in Developer Mode.

1.  Clone or download this repository as a ZIP file and unzip it.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable **"Developer mode"** in the top-right corner.
4.  Click the **"Load unpacked"** button.
5.  Select the folder where you unzipped the extension files.
6.  The "Terminal View" icon will appear in your toolbar.