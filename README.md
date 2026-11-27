# Szókincs — Hungarian flashcards that hunt for your mistakes

A multiple-choice flashcard app for conversational Hungarian. It works offline once installed on your
phone, deliberately serves the cards you're most likely to get wrong, and unlocks harder material only
as the easier material sticks.

**What's inside**

- **2,175 words and phrases** in six levels:
  - **A1–A2:** basics and everyday life (including countries, months, jobs and daily routine).
  - **B1:** conversation.
  - **B1+:** slang, fillers and set phrases.
  - **B2:** paperwork, relationships, health, cooking, work, news and opinions.
  - **B2+:** idioms and proverbs.
- **5,762 grammar and conjugation cards:**
  - 77 fully written-out verb tables: present, definite, past, conditional, commands, *-lak/-lek*, "should I…?" (*menjek?*), "have to" (*mennem kell*) and "would have" (*mentem volna*).
  - Case endings, possessives, personal forms (*nekem, veled…*), postpositions, *ez/az* forms, question words (*kivel? miről?*) and relative words (*aki, amit, ahol…*).
  - Verb prefixes and prefix word order (*Nem megyek be. / Gyere be!*), *-hat/-het*, comparison, word-building and participles.
  - Telling the time (*fél három* = 2:30!), dates, *szoktam* ("I usually") and *minél… annál…*.
- **Three kinds of card:** translate (both directions), *make the form* (e.g. `ház` → "in the house" → `házban`), and *what does it mean?* (e.g. `láttuk` → "we saw it").

**Answering**

Every card has four options and is graded automatically. The wrong options are chosen to be tempting:
- look-alike words (*kés / kész / kis*, *menni / venni / vinni*)
- the same verb in another person or tense (*láttuk / láttunk / látjuk*)
- the same word with another ending (*házban / házba / házból*) or a classic mistake (*szobaban*, *lók*, *Nem bemegyek*)
- answers you've picked by mistake before

After you answer, each option shows what it actually means.
- **Too easy:** you knew it well. The card is skipped for weeks, which also unlocks the next level sooner.
- **I guessed:** counts a lucky guess as a miss.

For a harder workout, Settings → *Type answers* makes you type the Hungarian instead.

---

## Putting it on your Pixel 6a

The app is a Progressive Web App: a website that installs like a normal app and works offline.
It needs to be hosted once somewhere with HTTPS. GitHub Pages is free and easiest.

### Already pushed the repo to GitHub?

1. On github.com open the repo, then **Settings → General → Danger Zone → Change repository visibility → Public**.
2. **Settings → Pages → Build and deployment**: choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
3. Push any new commits (`git add -A`, `git commit -m "…"`, `git push`). The site updates a minute later at `https://<your-github-username>.github.io/<repo-name>/`.

### Option A — GitHub CLI (about 2 minutes)

In PowerShell, from this folder:

```powershell
gh auth login                      # one-time: log in to GitHub in the browser
git init -b main
git add .
git commit -m "Szokincs"
gh repo create szokincs --public --source . --push
gh api -X POST "repos/{owner}/szokincs/pages" -f "source[branch]=main" -f "source[path]=/"
```

About a minute later the app is live at **`https://<your-github-username>.github.io/szokincs/`**.

### Option B — GitHub website only

1. On github.com create a new **public** repository (e.g. `szokincs`).
2. Click **"uploading an existing file"** and drag in everything in this folder (`index.html`, `css`, `js`, `data`, `icons`, …). Commit.
3. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. Wait about a minute; the URL appears at the top of the Pages settings.

> Free GitHub Pages needs a public repo. Only the app code is public. Your progress never leaves your phone.

### Install it on the phone

1. Open the URL in **Chrome** on the Pixel.
2. Tap **⋮ → Add to home screen → Install** (Chrome may also offer an "Install app" banner).
3. Open **Szókincs** from your home screen. It runs full-screen and works offline from now on.

### Pronunciation (optional)

The 🔊 button uses the phone's own text-to-speech. If it's silent or sounds English, open the phone's
**Settings**, search for **"Text-to-speech"**, set the preferred engine to **Speech Services by Google**, then tap
**⚙ → Install voice data → Hungarian**. The app's Settings screen shows whether it found a Hungarian voice.

### Typing accents

In *Type answers* mode there's an accent bar (á é í ó ö ő ú ü ű) above the keyboard. You can also add
Hungarian to Gboard (Gboard settings → Languages) and long-press vowels.

---

## How it picks the next card

Every card you've met has a memory estimate: the time until you'd have a 50/50 chance of forgetting it.
Each time, the app scores every card and picks (with a little randomness) among the most "dangerous" ones:

- **Forgetting risk:** how likely you are to get it wrong *right now*.
- **Mistake history:** each miss raises a card's difficulty, which slowly decays and multiplies the risk by up to about 2×.
- **Time away:** cards you haven't seen in weeks get an extra pull.
- **Mix-up alerts:** look-alikes (*kér/kérdez, hoz/visz, tegnap/holnap, báty/öcs/nővér/húg…*) are shown close together, so you have to tell them apart. The same happens when you pick another card's answer by mistake.
- **Try again:** anything you miss returns 3–6 cards later.

**Levels: harder material only as the basics stick.**
- A level's words start appearing once 35% of the previous level's words are *mastered*, meaning you'd still remember them in 3 days.
- Each grammar topic also waits for its level and for its easier prerequisite topics. For example, past-definite waits for past and definite, and prefix word order waits for prefixes and commands.
- **Progress → Levels** shows where you are. If a level feels too easy, there's an *Unlock now anyway* link.

**How the memory estimate updates.** A miss the app saw coming barely changes it, while forgetting something you "should" have known cuts it hard. Anything you miss comes back within a day.

**New cards and accuracy.** New cards arrive faster when you're acing things and slower when you're struggling. The aim is roughly 80% / 70% / 60% accuracy on *Relaxed / Challenging / Brutal* (Settings → Intensity).

**Order of introduction.**
- Words come in level by level, with topics interleaved.
- A grammar drill only uses words you've already met.
- English → Hungarian cards unlock once you can recognise a word.
- If you keep tapping *Too easy* on new cards, new material arrives faster.

The **Mistakes** mode drills only cards you've missed. The **Progress** tab lists your toughest cards.

## Backups

Progress is stored on the phone. **Settings → Backup → Save file** (or **Share…** to Drive or email) now and then,
and before clearing Chrome's data. **Restore** loads a backup on any device.

## Updating the app

1. Edit the files.
2. **Bump `VERSION` in `sw.js`.** Phones only fetch new files when this changes.
3. Push to GitHub (`git commit -am "…"`, then `git push`).

Next time you open the app it says *"Szókincs was updated"*. Tap **Reload**.

## Running it on your PC

```powershell
py -m http.server 8000
```

Then open <http://localhost:8000>. Open <http://localhost:8000/tests/test.html> to run the self-test:

- **Data checks:** accents, duplicates, ambiguous prompts, verb tables.
- **Simulation:** a 30-day simulated learner exercising the card picker.
- **UI smoke test:** clicks through the real app.

## Adding your own words

Everything lives in `data/`.

**Vocabulary** (`vocab-1.js` … `vocab-6.js`), one per line:

```
hungarian | english; alternatives | part-of-speech | optional note
menni (megy) | to go | v | Irregular: megyek, mész, megy…
```

- Verbs are written as *infinitive (dictionary form)*.
- `@2 Topic` starts a new section at level 2.
- Parts of speech: `n v adj adv pron num conj post part int phr q mod`.

**Grammar drills** (`grammar.js`): `base | english cue | answer | note | wrong / wrong / wrong`. Each line becomes two cards. The last field (hand-written wrong options) is optional. Skill headers can name prerequisites: `#order L3 after=pref,v-imp | …`.

**Verb tables** (`verbs.js`) and **look-alike groups** (`confusables.js`) are documented at the top of each file.

After editing, run the self-test page, bump `VERSION` in `sw.js`, and push.

## Files

```
index.html, css/app.css      the page and its styles
js/main.js                   screens and interaction
js/scheduler.js              memory model, card picking and level unlocking
js/choices.js                picks the tempting wrong options for multiple choice
js/deck.js                   builds cards from the data files
js/store.js                  saving progress on the phone and backups
js/check.js, js/speech.js    typed-answer checking and pronunciation
data/                        words, grammar drills, verb tables, look-alikes
sw.js, manifest.webmanifest  offline support and install info
icons/, tools/               app icons and the script that renders them from tools/icon.svg
tests/                       self-test page and screenshot harness
```
