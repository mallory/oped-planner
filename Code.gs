// Op-Ed Planner — standalone Google Apps Script, deployed as an editor add-on.
// Setup: script.google.com → New project → paste files → Deploy → Add-on →
//        then Deploy → Test deployments → Install (once, on your account).
// After that it appears under Extensions in every Google Doc you open.

const ANTHROPIC_KEY_PROP = 'ANTHROPIC_API_KEY';

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Op-Ed')
    .addItem('Start planner', 'showSidebar')
    .addSeparator()
    .addItem('Clear saved API key', 'clearApiKey')
    .addToUi();
}

// Called once when the add-on is installed or updated.
function onInstall() {
  onOpen();
}

// Workspace Add-on entry point — shown in the add-on panel.
function buildHomepage() {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Op-Ed Planner'))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph()
          .setText('Walk through ten planning questions and generate a draft outline and pitch paragraph.'))
        .addWidget(CardService.newTextButton()
          .setText('Start planner')
          .setOnClickAction(CardService.newAction().setFunctionName('openSidebar')))
    )
    .build();
}

function openSidebar() {
  showSidebar();
  return CardService.newActionResponseBuilder().build();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Op-Ed Planner');
  DocumentApp.getUi().showSidebar(html);
}

function getApiKey() {
  return PropertiesService.getUserProperties().getProperty(ANTHROPIC_KEY_PROP) || '';
}

function setApiKey(key) {
  PropertiesService.getUserProperties().setProperty(ANTHROPIC_KEY_PROP, key);
  return true;
}

function clearApiKey() {
  PropertiesService.getUserProperties().deleteProperty(ANTHROPIC_KEY_PROP);
  DocumentApp.getUi().alert('API key cleared.');
}

function getDocContent() {
  try {
    return DocumentApp.getActiveDocument().getBody().getText().trim();
  } catch(e) {
    return '';
  }
}

function extractAnswersFromDoc(docContent) {
  const apiKey = getApiKey();
  if (!apiKey || !docContent) return {};

  try {
    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Extract any information from this document that maps to op-ed planning fields. Return ONLY a JSON object with these exact keys (use "" for anything not found):
why_you, why_now, why_this, why_us, problem, evidence, analysis, counter_arguments, claim, stakes

Document:
${docContent.slice(0, 4000)}

JSON only, no other text:`
        }]
      }),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) return {};

    const text = JSON.parse(response.getContentText()).content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  } catch(e) {
    return {};
  }
}

function generateOutlineAndPitch(answers) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { error: 'No API key found. Please reload the sidebar and enter your key.' };
  }

  try {
    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: buildPrompt(answers) }]
      }),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    const data = JSON.parse(response.getContentText());

    if (code !== 200) {
      const msg = (data.error && data.error.message) ? data.error.message : 'HTTP ' + code;
      return { error: 'Anthropic API error: ' + msg };
    }

    return createOutputDoc(answers, data.content[0].text);

  } catch (e) {
    return { error: e.toString() };
  }
}

function buildPrompt(answers) {
  function f(label, value) {
    return label + ': ' + ((value && value.trim()) ? value.trim() : '(not provided)');
  }

  return [
    'You are helping a writer plan an op-ed. Based on their answers, produce exactly two sections.',
    '',
    'Writer: Mallory Knodel — public interest technologist, founder of the Social Web Foundation,',
    'author of "How the Internet Really Works."',
    'Target: 700–1400 words. Style goal: Absorb (ground the reader) → Bridge (bigger picture) → Sparkle (memorable).',
    '',
    '---',
    f('WHY YOU', answers.why_you),
    f('WHY NOW (news hook)', answers.why_now),
    f('WHY THIS', answers.why_this),
    f('WHY US (publication/audience)', answers.why_us),
    f('PROBLEM / STATUS QUO', answers.problem),
    f('EVIDENCE', answers.evidence),
    f('ANALYSIS', answers.analysis),
    f('COUNTER-ARGUMENTS', answers.counter_arguments),
    f('CLAIM / MAIN POINT', answers.claim),
    f('STAKES / WHY IT MATTERS', answers.stakes),
    '---',
    '',
    'Output with these exact headings:',
    '',
    '## Pitch Paragraph',
    '',
    '[100–150 words, compelling, specific, editor-ready]',
    '',
    '## Draft Outline',
    '',
    '### Working title',
    '[suggestion]',
    '',
    '### Lede / Hook',
    '[1–2 sentences anchoring the reader in the news moment]',
    '',
    '### The Problem',
    '[the gap in understanding or contradiction that drives the essay]',
    '',
    '### Evidence',
    '- [specific fact or example]',
    '- [specific fact or example]',
    '',
    '### Analysis',
    '[what the evidence means — the interpretive move]',
    '',
    '### Counter-argument & response',
    '[what critics would say and your rebuttal in brief]',
    '',
    '### The Claim',
    '[the core argument, clearly stated]',
    '',
    '### Stakes / Close',
    '[why readers should care and what they should think or do]'
  ].join('\n');
}

function createOutputDoc(answers, content) {
  const tabTitle = 'Oped';

  const doc = DocumentApp.getActiveDocument();
  const tab = doc.addTab();
  const body = tab.asDocumentTab().getBody();

  body.appendParagraph(tabTitle).setHeading(DocumentApp.ParagraphHeading.TITLE);

  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t) continue;

    if (t.startsWith('## ')) {
      body.appendParagraph(t.slice(3)).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    } else if (t.startsWith('### ')) {
      body.appendParagraph(t.slice(4)).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    } else if (/^[-*] /.test(t)) {
      body.appendListItem(t.slice(2));
    } else {
      body.appendParagraph(t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1'));
    }
  }

  body.appendHorizontalRule();
  body.appendParagraph('Your answers').setHeading(DocumentApp.ParagraphHeading.HEADING1);

  const fields = [
    ['Why you?', answers.why_you],
    ['Why now?', answers.why_now],
    ['Why this?', answers.why_this],
    ['Why us?', answers.why_us],
    ['Problem / Status quo', answers.problem],
    ['Evidence', answers.evidence],
    ['Analysis', answers.analysis],
    ['Counter-arguments', answers.counter_arguments],
    ['Claim / Main point', answers.claim],
    ['Stakes / Why it matters', answers.stakes]
  ];

  for (const [label, value] of fields) {
    if (value && value.trim()) {
      body.appendParagraph(label).setHeading(DocumentApp.ParagraphHeading.HEADING2);
      body.appendParagraph(value.trim());
    }
  }

  return { tabTitle };
}
