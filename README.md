# Op-Ed Planner

A Google Docs add-on that uses Claude to turn a typical op-ed planning template into an interactive interview — you answer ten questions by typing or dictating, and it generates a draft outline and pitch paragraph directly in your document.

Built by [Mallory Knodel](https://malloryknodel.net).

---

## What it does

When you are in any Google Doc, you can invoke the planner (see below). A new **Op-Ed** menu appears. Click **Start planner** to open a sidebar that walks you through the ten questions from the op-ed template one at a time:

1. Why you?
2. Why now? *(news hook)*
3. Why this?
4. Why us?
5. Problem / Status quo
6. Evidence
7. Analysis
8. Counter-arguments
9. Claim / Main point
10. Stakes / Why it matters

If you've already written notes in the document, the planner will read them and pre-fill your answers as a starting point.

When you're done, click **Generate draft** and the planner adds a new tab to your document containing:
- A **pitch paragraph** (~150 words, needs your edits before sending to an editor)
- A **draft outline** with labeled headings
- Your source answers for reference at the bottom

---

## What you need

- A Google account
- An Anthropic API key (used to generate the outline and pitch) — see setup below

---

## Setup

### 1. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) and create an account
2. Go to **Settings → API Keys → Create Key**
3. Copy the key (it starts with `sk-ant-`) — you'll paste it into the planner on first use
4. Add a small amount of credit at **Settings → Billing** — each op-ed planning session costs a fraction of a cent

### 2. Set up the script

1. Go to [script.google.com](https://script.google.com) and sign in with your Google account
2. Click **New project** (top left)
3. You'll see a default file called `Code.gs` — replace its contents by pasting in the contents of [`Code.gs`](Code.gs) from this repo
4. Click the **+** next to **Files** → choose **HTML** → name it exactly `Sidebar` (no .html extension needed) → paste in the contents of [`Sidebar.html`](Sidebar.html)
5. Click **Project Settings** (the gear icon, bottom left) → check **Show "appsscript.json" manifest file in editor**
6. A file called `appsscript.json` will appear in the file list — replace its contents with the contents of [`appsscript.json`](appsscript.json) from this repo
7. Click **Save** (the floppy disk icon, or Cmd+S)

### 3. Install it on your account

This add-on is a **Workspace Add-on**, which means it installs once and works in every Google Doc on your account — no document selection or per-file setup required.

1. In the Apps Script editor, click **Deploy → Test deployments**
2. Click **Install** and follow the authorization prompts
3. Open any Google Doc — the add-on is now available two ways:
   - **Extensions → Op-Ed → Start planner** in the menu bar
   - The **puzzle-piece icon** on the right side of Docs opens the add-on panel, where you'll see an Op-Ed Planner card with a **Start planner** button

---

## Using the planner

1. Open a Google Doc (a blank one, or one with existing notes)
2. Click **Extensions → Op-Ed → Start planner**
3. The first time you use it, you'll be asked to enter your Anthropic API key — paste it in and click **Save & continue** (it's stored securely in your Google account and never shared)
4. Answer each question by typing or clicking **Dictate** to speak your answer (Chrome/Edge only)
5. Click **Next** to move through the questions — you can go **Back** to revise
6. Click **Generate draft** on the last question

Your outline and pitch will appear in a new tab called **Oped** in the same document.
