# Creator Campaign Review

A simple tool for creators who post sponsored content. It looks at how a video did, tells you in plain words what most likely went wrong (or right), and gives you one clear thing to try on your next post.

## Try it

👉 <a href="https://chenjiahui0806-crypto.github.io/creator-campaign-review/prototypes/" target="_blank" rel="noopener noreferrer"><b>Open the live demo</b></a>

Nothing to install, no sign-up. Anything you type in stays in your own browser — nobody else can see it.

## What it does

- **See all your posts on a calendar.** Every video goes on the day you posted it. The color tells you at a glance how it did — green means better than your usual, red means worse, gray means normal.
- **Click any post to see why.** It explains in plain words where things went wrong: did people stop watching in the first few seconds? Did they watch but not tap through to the product? Did they click but not buy?
- **Add your own posts.** Type a post's numbers in by hand, or upload a spreadsheet to add several at once.
- **Watch it get smarter over time.** The more posts you add, the more sure the tool becomes about what's normal for you — and it says so honestly when it doesn't have enough data yet to be confident.

## A few things worth knowing

- It only ever compares a post to **your own** past posts — never to other creators or industry averages, since everyone's audience and prices are different.
- If a post is brand new with nothing to compare it to, the tool says so instead of guessing.
- This is a working prototype, not a finished app. Anything you enter is saved only in your own browser, not on a server — it won't be there if you switch devices or clear your browser data.

## For the curious

There's also an in-product <a href="https://chenjiahui0806-crypto.github.io/creator-campaign-review/prototypes/page5_how_it_works.html" target="_blank" rel="noopener noreferrer"><b>How it works</b></a> page that shows the seven diagnosis rules and real numbers from whatever's in your browser right now.

If you want to see how it's built under the hood:

- <a href="https://github.com/chenjiahui0806-crypto/creator-campaign-review/blob/main/TECHNICAL.md" target="_blank" rel="noopener noreferrer"><b>TECHNICAL.md</b></a> — the detailed technical writeup: architecture, design decisions, repo structure
- <a href="https://github.com/chenjiahui0806-crypto/creator-campaign-review/tree/main/prototypes" target="_blank" rel="noopener noreferrer"><code>/prototypes</code></a> — the pages you just clicked through
- <a href="https://github.com/chenjiahui0806-crypto/creator-campaign-review/tree/main/prd" target="_blank" rel="noopener noreferrer"><code>/prd</code></a> — the full written product plan behind it
- <a href="https://github.com/chenjiahui0806-crypto/creator-campaign-review/tree/main/sql" target="_blank" rel="noopener noreferrer"><code>/sql</code></a>, <a href="https://github.com/chenjiahui0806-crypto/creator-campaign-review/tree/main/skills" target="_blank" rel="noopener noreferrer"><code>/skills</code></a>, <a href="https://github.com/chenjiahui0806-crypto/creator-campaign-review/tree/main/verification" target="_blank" rel="noopener noreferrer"><code>/verification</code></a> — the technical logic behind how it makes its diagnoses

---

Built as an independent project, drawing on firsthand experience running sponsored content on TikTok.
