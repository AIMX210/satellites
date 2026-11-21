# Watched: Hindi (hi) localisation style guide

Draft for review, 2026-11-21. The guide binds every `hi` string the product shows, speaks or sends: the app, share cards
and share pages, post text, alt text, aria labels, the time-lapse video, About and the loading screen. If a
translator's habit disagrees with this guide, the guide wins. If the guide and the English disagree on a fact, the
English wins and the guide is wrong: report it.

One Hindi catalog, in the standard Hindi of good Indian apps and news sites, serves readers across India (and Hindi
readers abroad). It is reachable by `?hl=hi` only (`LOCALE_INFO.hi.listed: false`) until a native reviewer signs it off.

The English source of truth is the English namespaces in `src/i18n/en/*.ts`, the share card catalog
`api/_lib/i18n/card/en.ts`, `src/i18n/bootText.ts`, and `docs/DESIGN.md` §7 for the voice and the verdict vocabulary.

**Notation.** In frames, `*…*` marks the one serif accent (signal orange) and `**…**` the strong part (bold, or a part
that some layouts hide, as each message's comment says). Runtime slots are `[PLACE]`, `[SAT]`, `[NUM]`, `[TIME]` (a 24 h
clock with its zone, "16:14:21 UTC") and `[DAY]` (a day written by the `time` namespace). `⍽` in a frame is a no-break
space (U+00A0); in code it is always written as the escape `\u00a0`, never as a literal character.

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Register | Everyday standard Hindi (मानक हिंदी) as BBC Hindi, Google's and WhatsApp's Hindi interfaces write it: the common word of whatever origin (तस्वीर, हफ़्ता, जगह, शायद, असली next to उपग्रह, कक्षा, सार्वजनिक, क्षितिज). Never a heavy Sanskrit coinage where a common word exists, never Hinglish (no English verbs, no English plurals). |
| Address | `आप`, always. Instructions and buttons in the polite imperative `-एँ` (`खोजें`, `शेयर करें`, `फिर कोशिश करें`), which has no gender. `आप` is never the subject of a participle that shows gender (`थे / थीं`, `रहे / रही`, `सकते / सकती`, `गए / गईं`). The copula `हैं` is allowed (`आप उसमें नहीं हैं`). |
| Product verb ("watched") | `देखना`: `देखा`, `देखा गया`. Never `निगरानी`, `नज़र रखना`, `जासूसी`, `फ़ोटो खींचना` as the product verb. |
| Hero | `किसी चीज़ ने` / `इस हफ़्ते` / `*आपको* देखा।` |
| "Satellite" | `उपग्रह` (m), plural `उपग्रह`, oblique plural `उपग्रहों`. Never `सैटेलाइट` / `सैटेलाइट्स`. |
| Satellite as subject | Every satellite and station is masculine (`उपग्रह`, `स्टेशन`, `यान` are all masculine), so a bare `[SAT]` takes masculine agreement and needs no head noun. Perfective transitive sentences use `ने`, so the verb never agrees with the satellite anyway (`Sentinel-2C ने *Waterloo* को देखा`). A nameless satellite is `एक उपग्रह` / `किसी उपग्रह ने`. |
| Place name | Always followed by a postposition (`को`, `के ऊपर`, `में`, `पर`, `से`, `तक`, `का/की/के`) or standing alone (a title, after a colon). Never the subject of a verb or adjective that would have to agree with it. Pointed back to with `यहाँ`, `इस जगह`, `उसके ऊपर`. |
| Counts | `one` / `other` from `fmt('hi').plural`, but Intl puts 0 in `one`: Hindi counts zero with the plural (`0 तस्वीरें`), so every count goes through a helper that sends 0 to `other` (§5.3). Before a postposition the noun takes its oblique plural (`7 दिनों में`, `256 उपग्रहों ने`). |
| "Pass" | Noun `उड़ान` (f; `उड़ानें`, oblique `उड़ानों`). A count of passes in a verdict is `बार` (invariant): `देखा गया · 31 बार`. Never `पास` (it means "near"). |
| Verdicts | `देखा गया` · `संभवतः देखा गया` · `यहाँ देख सकता था` · `ऊपर से गुज़रा`. Lanes: `तस्वीर` · `संभवतः` · `मुमकिन` · `ऊपर से`. |
| Image vs photo | `तस्वीर` (f) for any image (photo, mosaic, radar, full disc); `फ़ोटो` (f) only for an optical photograph. A radar image is `रडार तस्वीर`, never `फ़ोटो`. |
| Digits | Western 0–9 from `fmt('hi')` (Intl `hi`), with Intl's Indian grouping (`16,893`, `12,34,567`). Never Devanagari digits ०१२. |
| Units | `किमी`, `मी`, `सेमी`, `किमी/से` in readouts, chips and prose (as Hindi newspapers write them); `मीटर` spelled out in post text. `°` and `%` attach to the number. A no-break space ties a number to its unit or noun. |
| Punctuation | The danda `।` ends every sentence in running copy, attached to the last word. `?` for questions. Labels, buttons and chips take no final mark. No semicolons in Hindi prose, no exclamation marks, curly quotes “ ”. |
| Spelling | Nukta on `ज़` and `फ़` always (`हफ़्ता`, `ज़मीन`, `फ़ोटो`); never on क ख ग (`आखिरी`, `खबर`, `करीब`). Chandrabindu where the syllable has nothing above the headline (`यहाँ`, `पहुँच`, `ऊँचाई`), anusvara where it has (`में`, `हैं`, `नहीं`, `तस्वीरें`) and for a nasal before a consonant (`अंदर`, `संबंध`). |
| Dates | Gregorian, CLDR `hi` names from Intl, never a table: `रवि, 1 नवंबर` (pass rows), `रविवार, 1 नवंबर` (spoken), `1 नवंबर 2026`. Full month names everywhere (CLDR's `नव॰` abbreviations are not how Hindi copy writes dates). Ranges `1 → 8 नवंबर`. |
| Time | International 24 h clock with its zone (`16:14 EST`), never `बजे` or `सुबह / शाम` around it. In prose a clock takes `पर` (`16:14 UTC पर`), and post text says `स्थानीय समयानुसार 11:21 पर`. |
| Compass | Prose uses Hindi words (`दक्षिण की ओर`, `61 किमी पश्चिम में`); the 16-point readout abbreviations stay Latin (`SSW`), as coordinates do. |
| Never translated | Watched, www.watched.earth, satellite, sensor, product and agency names (in Latin: NASA, not नासा), NORAD ids, UTC and zone abbreviations, coordinates, licence attribution lines, file-name words. |
| Script | `data-script="devanagari"`. Devanagari has no case: a mono caps row simply shows the words (Latin inside it still uppercases). Letter-spacing must be 0 on Devanagari, or the headline stroke breaks (§6.8). |

## 1. Register and address

### 1.1 The register

The reader is anyone who reads Hindi on a phone in India: a student in Lucknow, an engineer in Pune who reads Hindi
news, a retired teacher in Patna. They meet good Hindi daily in BBC Hindi, Dainik Bhaskar's and Amar Ujala's web desks,
and the Hindi interfaces of Google, WhatsApp and their bank. That is the register: **standard written Hindi that sounds
like careful speech.**

Two failure modes sit on either side of it.

- **Sanskritised officialese** (सरकारी हिंदी): `छायाचित्र` for photo, `अभिलेखागार` for archive, `उपलब्धता की स्थिति`,
  `कृपया पुनः प्रयास करें`. Correct, and unreadable as an interface: it sounds like a railway form. A word of Sanskrit
  origin is fine when it is the ordinary word (`उपग्रह`, `कक्षा`, `क्षितिज`, `सार्वजनिक`, `दैनिक`, `संभवतः`); it is
  wrong when a common word exists (`तस्वीर` over `छायाचित्र`, `संग्रह` over `अभिलेखागार`, `फिर` over `पुनः`).
- **Hinglish**: `सैटेलाइट्स ने वॉच किया`, `इमेजेज़ पब्लिश हुईं`, `लोकेशन एक्सेस डिनाइड`. English verbs with `किया`,
  English plurals (`-स`, `-ज़`) and English nouns where Hindi has a common one make the product sound like a quick
  machine pass.

Loanwords are welcome where they are the established Hindi word in Indian interfaces and news: `शेयर करें`, `लिंक`,
`कॉपी`, `पोस्ट`, `वीडियो`, `फ़ोटो`, `कैमरा`, `रडार`, `पिक्सेल`, `ग्लोब`, `पिन`, `रीप्ले`, `ज़ूम`, `डाउनलोड`, `सेव`,
`ब्राउज़र`, `कनेक्शन`, `लोकेशन`, `टाइम-लैप्स`, `स्कैन`, `मोज़ेक`, `इन्फ्रारेड`. They decline as Hindi nouns (`लिंक`
m, `पोस्ट` f, `फ़ोटो` f, `लोकेशन` f) and never take an English plural.

### 1.2 Address: `आप`, and the gender trap

`आप` is the only choice. `तुम` is what friends and family use; from an app it reads as either over-familiar or rude, and
no Indian product addresses a stranger with it. `आप` also carries no gender in its own forms: `आपको`, `आपका / आपकी /
आपके` (agreeing with the thing possessed, never with the reader), `आपके ऊपर`, `आपकी जगह`.

The trap is the verb. Hindi participles agree with their subject in gender: `आप देख सकते हैं` addresses a man, `आप देख
सकती हैं` a woman, and the code cannot know which. So:

Allowed:
- The polite imperative / subjunctive in `-एँ`, which has no gender: `खोजें`, `डालें`, `आज़माएँ`, `शेयर करें`, `फिर
  कोशिश करें`. It is the form every Hindi interface uses for buttons and instructions.
- `आप` as the subject of the copula `हैं` / `हों`, which has no gender: `आप उसमें नहीं हैं`, `अगर आप धरती के उस हिस्से
  में हैं`.
- `आपको`, `आपका`, `आपके`, `आपकी` anywhere.
- The product's `हम` with masculine plural verbs, the conventional neutral for an organisation: `हम गिनते हैं`, `हम नहीं
  जान सकते`.
- Impersonal and passive frames: `… भेजी जाती है`, `… नहीं हो सकी`, `… किया जा सकता है`.
- The reader's own voice in the first person, where the English has it (`मेरी लोकेशन`, `मुझे चौंकाएँ`,
  `क्या यह मुझे देख सकता है?` with `यह` as the subject).

Banned:
- `आप` as the subject of any participle: `आप थे / थीं`, `आप देख रहे हैं`, `आप चाहें तो देख सकते हैं`, `आपने चुना`
  (fine grammatically, `ने` makes it neutral, but the product never narrates what the reader did).
- An adjective that describes the reader (`आप तैयार हैं`, `आप जुड़े हुए हैं`).
- `तुम`, `तू`, slash forms (`सकते/सकती`), and `कृपया` (§2.3).

Rewrites of the English "you + verb":

| English | Hindi | How |
|---|---|---|
| If you were in reach | `अगर आपकी जगह पहुँच में थी` | The verb agrees with `जगह` (f). |
| You're not in it | `आप उसमें नहीं हैं` | Copula. |
| the pass you picked | `चुनी गई उड़ान` | Passive participle, agrees with `उड़ान`. |
| Check your connection and try again | `अपना कनेक्शन जाँचें और फिर कोशिश करें` | Polite imperative. |
| It saw your clouds, not your streets | `उसने आपके बादल देखे, आपकी सड़कें नहीं` | `ने`; the verb agrees with `बादल`. |

### 1.3 Surfaces

| Surface | Form | Example |
|---|---|---|
| Display lines (hero, headline, About title, card) | Declarative, verb-final, past tense, the danda at the end. | `पिछले 7 दिनों में *Waterloo* को **256 उपग्रहों ने देखा**।` |
| Sentences (results, pass paragraph, footnotes) | Plain declarative Hindi; `हम` for the product; the satellite as subject. | `16:14:21 UTC पर Sentinel-2C ठीक ऊपर से गुज़रा।` |
| Buttons | Polite imperative `-एँ` with its object, or a bare noun where the screen implies the action. | `शेयर करें` · `लिंक कॉपी करें` · `रद्द करें` · `रीप्ले` |
| Mono labels (readouts, chips, section rules) | Nouns or noun phrases, no final mark. | `ऊँचाई 786 किमी` · `02 / उड़ानें` · `बादल छाए · 93%` |
| Status lines (progress) | A noun with `जारी` or a short `-रहे हैं` / `-हो रही है` clause, no final mark. | `खोज जारी` · `सूची लोड हो रही है` |
| Error notices | What failed, impersonally (`… नहीं हो सकी`, `… से जवाब नहीं मिला`), then one recovery step as a polite imperative. | `कक्षाओं की सूची लोड नहीं हो सकी। अपना कनेक्शन जाँचें और फिर कोशिश करें।` |
| About | Plain, warm, second person; the visitor's questions as questions. | `क्या यह मुझे देख सकता है? नहीं।` |

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in Hindi

- **Declarative:** the simple past, stated flat (`देखा`, `गुज़रा`, `सार्वजनिक हुईं`). `शायद` only where the English
  says "may" or "might"; `संभवतः` only in the likely verdict's name.
- **Specific:** the number and the name carry the sentence (`786 किमी की ऊँचाई पर`, `16:14:21 UTC पर`, `7.46 किमी/से
  की रफ़्तार से`). Never round a number and never replace one with `कई` or `बहुत सारे`.
- **Quietly uncanny:** Hindi is verb-final, so the weight falls on the last words: `*आपको* देखा।`, `…आपके आसमान से
  गुज़रा।`, `उसने आपके बादल देखे, आपकी सड़कें नहीं।` Calm is the point: no `सचमुच`, `बिल्कुल`, `ज़बरदस्त`, no
  exclamation mark, no drama word.
- **Second person:** `आप` where the English has "you", `आपकी जगह` where it has "your spot", `आपका आसमान` for "your
  sky". Never add `आप` for warmth where the English has none.

### 2.2 Rhythm and length

- One fact per sentence, about 20 words at most. A number with its unit counts as one word.
- Hindi prefers two short sentences to one long one with a participle chain. The English "…, moving south at 7.46
  km/s" becomes a second sentence: `वह 7.46 किमी/से की रफ़्तार से दक्षिण की ओर जा रहा था।`
- Time, subject, place, manner, verb: `[TIME] पर [SAT] [where] गुज़रा।` The focus sits right before the verb, which is
  where the headline puts its strong count (§3.3).
- Postpositions belong to their noun: in display lines a no-break space ties a short postposition to the name before it
  (`Waterloo⍽को`), so a line never starts with `को` (§6.7).

### 2.3 What to avoid

- **Officialese:** `कृपया`, `पुनः`, `उपलब्धता`, `संबंधित`, `उक्त`, `हेतु`, `द्वारा` as a reflex passive (`उपग्रह द्वारा
  देखा गया` → `उपग्रह ने देखा`). `कृपया` in particular: the English never says "please", and a Hindi interface that
  does on every error sounds like a government portal.
- **Calques of English structure:**
  - `X के द्वारा Y किया गया` for an English passive: write the active with `ने`.
  - `X होने के नाते`, `के संदर्भ में`, `के रूप में` for "as": say the thing.
  - `करके` chains translating English participles: split the sentence.
  - `यह है कि …` openers, `जैसा कि आप जानते हैं`.
  - English word order with Hindi words (`देखा Waterloo को 256 उपग्रहों ने`).
- **Marketing:** `खोजिए`, `जानिए`, `अद्भुत`, `अभी देखें!`, `बिल्कुल मुफ़्त`. The English never sells.
- **Religious and fatalistic formulas** for uncertainty or delay: never `भगवान जाने`, `राम भरोसे`. "We can't know" is
  `हम नहीं जान सकते`.
- **Over-politeness and apology:** `क्षमा करें`, `माफ़ कीजिए`, `दुर्भाग्य से`. The English states the fact and moves on.

### 2.4 Before and after

| Before (rejected) | After | What changed |
|---|---|---|
| `पिछले सात दिनों में 256 सैटेलाइट्स ने वॉटरलू की फ़ोटो खींची!` | `पिछले 7 दिनों में *Waterloo* को **256 उपग्रहों ने देखा**।` | Hinglish plural, the photographed verb, a respelt place name, a spelled-out number and an exclamation mark, all gone. |
| `कृपया अपना इंटरनेट कनेक्शन चेक करें और पुनः प्रयास करें।` | `अपना कनेक्शन जाँचें और फिर कोशिश करें।` | `कृपया` and the Sanskrit `पुनः प्रयास` out; `जाँचें` over Hinglish `चेक करें`. |
| `आप देख सकते हैं कि आपके ऊपर से कौन से उपग्रह गुज़रे।` | `पिछले 7 दिनों में उसके ऊपर से गुज़रा हर उपग्रह देखें…` | The gendered `सकते` becomes an imperative. |
| `Waterloo के ऊपर उपग्रहों द्वारा निगरानी की गई।` | `*Waterloo* को 256 उपग्रहों ने देखा।` | `द्वारा` passive and `निगरानी` (surveillance) out. |
| `Waterloo साफ़ था।` | `आपकी जगह पर आसमान साफ़ था।` | The adjective had to guess the place's gender. |

## 3. The key lines

### 3.1 The hero

```
किसी चीज़ ने
इस हफ़्ते
*आपको* देखा।
```

As a catalog entry: `hero: [['किसी चीज़ ने'], ['इस हफ़्ते'], [accent('आपको'), ' देखा।']]`, the same in `landing.hero`
and `card.hero`.

- "Something" is `किसी चीज़ ने`, "some *thing*": the agent of seeing is a thing, which is exactly the slight wrongness
  the English has. `किसी ने` would mean "someone", a person, a stalker; the English is careful to say a thing.
- `ने` makes `देखा` masculine singular whatever watched, so nothing in the line has a gender to guess.
- The accent is `आपको`, the word that means "you", in the serif, followed by the verb. Hindi ends on the verb, so the
  line lands as `*you* saw.` The full stop is the danda.
- The order Subject · Time · Object · Verb is unmarked Hindi, and opening on "Something" keeps the English hook.

| Alternate | Why it loses |
|---|---|
| `इस हफ़्ते` / `किसी चीज़ ने` / `*आपको* देखा।` | Equally natural, but it opens slowly on a time phrase; the English opens on the strange subject. |
| `इस हफ़्ते किसी की` / `नज़र *आप* पर` / `पड़ी।` | A lovely idiom ("someone's gaze fell on you"), but `किसी` is a person, and the product verb everywhere else is `देखना`. |
| ~~`किसी चीज़ ने इस हफ़्ते आप पर नज़र रखी।`~~ | `नज़र रखना` is keeping someone under watch: surveillance. |
| ~~`इस हफ़्ते कोई आपको देख रहा था।`~~ | A person, and the progressive claims it lasted; the English states one past fact. |

Tab title (`app.documentTitle` and the boot title): `Watched · किसी चीज़ ने इस हफ़्ते आपको देखा` (no danda: a title takes
no full stop). The share hook and the invite echo it: `किसी चीज़ ने इस हफ़्ते आपको भी देखा।`

### 3.2 The sub line

`धरती की कोई भी जगह डालें। पिछले 7⍽दिनों में उसके ऊपर से गुज़रा हर उपग्रह देखें, और उनकी ली हुई असली तस्वीरें भी।`

- `डालें` is how Hindi interfaces say "enter" (`पासवर्ड डालें`); `धरती` is the everyday word for the Earth.
- `उसके ऊपर` points back to `जगह`; `उसके` agrees with nothing, so the pronoun is safe.
- `गुज़रा हर उपग्रह` ("every satellite that passed") is a participle phrase, masculine for `उपग्रह`.
- `उनकी ली हुई असली तस्वीरें भी` ("and the actual pictures they took, too"): `ली हुई` agrees with `तस्वीरें`. `असली`
  carries "actual". `भी` closes the sentence on the pictures, as the English does.
- The share page's generic description is the same sentence (`card.page.description`, with 7 written in).

### 3.3 Results headline and second line

**`results.headline.watched(n, place, when)`**

```
{window} *{place}*⍽को **{n}⍽{उपग्रह ने | उपग्रहों ने} देखा**।
```

| Case | Hindi |
|---|---|
| n = 1 | `पिछले 7 दिनों में *Waterloo* को **1 उपग्रह ने देखा**।` |
| n = 256 | `पिछले 7 दिनों में *Waterloo* को **256 उपग्रहों ने देखा**।` |
| An older window | `29 अक्टूबर से 5 नवंबर के बीच *Waterloo* को **256 उपग्रहों ने देखा**।` |
| A one-day window | `पिछले 1 दिन में …` |

- Object before subject (OSV) is ordinary Hindi when the subject is the news: the pre-verbal position is Hindi's focus
  position, and that is where the strong count phrase sits. The English bolds "256 satellites watched"; Hindi bolds the
  same words in its own order, num inside the strong part.
- `ने` makes `देखा` independent of the count's number and the place's gender: one verb form for every n.
- The accent is the place alone; `को` follows as plain text, tied by a no-break space.

**`results.headline.none(place, past)`**: `इस हफ़्ते *Waterloo* को हमारी सूची के किसी भी उपग्रह ने नहीं देखा।` (`उस
हफ़्ते` for a past week). "No satellite we track" is "no satellite on our list", the orbit catalog we load.

**`results.imagesPublic(k)`**

| k | Parts | While partial |
|---|---|---|
| 1 | `**कम से कम **` + `num(1)` + `⍽तस्वीर सार्वजनिक हुई।` | `कम से कम 1 तस्वीर सार्वजनिक हुई।` |
| 27 | `**कम से कम **` + `num(27)` + `⍽तस्वीरें सार्वजनिक हुईं।` | `कम से कम 27 तस्वीरें सार्वजनिक हुईं।` |

- `सार्वजनिक हुईं` ("became public") is how Hindi news says it; the verb agrees with `तस्वीर` (f), which we know, so
  removing `कम से कम` changes no other word.
- `noImages`: `इस हफ़्ते कोई तस्वीर सार्वजनिक नहीं हुई।` / `उस हफ़्ते …`
- `archiveDown`: `तस्वीरों के संग्रहों ने जवाब नहीं दिया, इसलिए हम अभी सार्वजनिक तस्वीरें नहीं गिन सकते।`

**`results.why`**

| Key | Hindi |
|---|---|
| `sunNeverRose` | `सूरज निकला ही नहीं, इसलिए दिन में देखने वाला कोई कैमरा इसे नहीं देख सका।` |
| `sunBarelyRose` | `सूरज मुश्किल से ही निकला, इसलिए दिन में देखने वाला कोई कैमरा इसे नहीं देख सका।` |
| `infrared(n)` | `फिर भी मौसम उपग्रहों ने इन्फ्रारेड में इसे ` + `3` + ` बार स्कैन किया।` (`ने` + `इसे`: no agreement) |
| `radar(…)` | `रडार को रोशनी की ज़रूरत नहीं होती। Umbra-08, Capella-14 और 7 दूसरे रडार उपग्रह पहुँच के भीतर से ` + `1,204` + ` बार गुज़रे।` One name alone: `… Umbra-08 पहुँच के भीतर से 3 बार गुज़रा।` The list is joined by hand: Intl's `hi` list puts a comma before `और`, which Hindi does not. |
| `unpublished(n)` | `Sentinel-2 या Landsat का एक उपग्रह दिन में यहाँ से एक बार गुज़रा, पर अभी तक कोई दृश्य प्रकाशित नहीं हुआ है।` / `Sentinel-2 या Landsat के उपग्रह दिन में यहाँ से 3 बार गुज़रे, …` (a head noun, so the verb's number is not a guess between two names) |
| `none` | `दिन में सार्वजनिक तस्वीरें देने वाला कोई उपग्रह यहाँ से नहीं गुज़रा।` |

### 3.4 The pass paragraph (`pass` namespace)

The English sentence "Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s." becomes two
Hindi sentences, the way a Hindi news report would write it, with the clock first:

```
[TIME] पर [SAT] ठीक ऊपर से गुज़रा। वह [ALT] की ऊँचाई पर [SPEED] की रफ़्तार से [HEADING] की ओर जा रहा था।
[TIME] पर [SAT] यहाँ से [KM] [DIR] में गुज़रा। वह …
```

`16:14:21 UTC पर Sentinel-2C ठीक ऊपर से गुज़रा। वह 786 किमी की ऊँचाई पर 7.46 किमी/से की रफ़्तार से दक्षिण की ओर जा
रहा था।`

- The clock opens the sentence. Hindi's unmarked order would put it after the subject (`Sentinel-2C 16:14:21 UTC पर`),
  but a satellite name that ends in a number then runs into the clock (`Landsat 9 16:14 EST`, `WorldView Legion 4
  10:52`); a time adverb first is just as natural.
- The altitude goes to the second sentence for the same reason (`Landsat 9 705 किमी`).
- `गुज़रा`, `जा रहा था`: masculine, for the satellite (§5.2). `वह` points back to it, and `उसका`, `उसके`, `उसने`
  throughout the paragraph (never a mix of `यह` and `वह` forms). The camera is the subject when it is the camera that
  looks (`उसका कैमरा सीधे नीचे देख रहा था`), which also saves a third `वह` in a row.
- Two direction frames from one word table: where it was from the place takes `में` (`61 किमी पश्चिम में`), where it
  was heading takes `की ओर` (`दक्षिण की ओर`).
- The time takes `पर`, never `बजे`: `बजे` is for spoken hours, not a 24 h clock with seconds.

The other sentences:

| Key | Hindi |
|---|---|
| `lookingDown` | `उसका कैमरा सीधे नीचे देख रहा था।` |
| `lookingOff(deg)` | `उसका कैमरा सीधे नीचे से 5.4° हटकर देख रहा था।` |
| `cloudCover(pct)` | `पूरे दृश्य के 25% हिस्से पर बादल थे।` |
| `mosaic` | `उसके VIIRS इमेजर ने Waterloo को NASA के असली रंगों वाले दैनिक मोज़ेक में 375 मी प्रति पिक्सेल पर दर्ज किया।` |
| `radarImaged` | `उसके रडार ने एक तरफ़ 38.2° झुककर अंधेरे में Waterloo की तस्वीर 20 मी प्रति पिक्सेल पर ली।` |
| `likely.crossed` | `16:14 EST पर Landsat 9 ठीक ऊपर से गुज़रा। वह 705 किमी की ऊँचाई पर था, और यह जगह उसकी 185 किमी चौड़ी पट्टी के भीतर थी।` |
| `likely.dark` | `यहाँ अंधेरा था। मौसम इमेजर रात में भी इन्फ्रारेड में स्कैन करते रहते हैं, इसलिए उसने आपके बादल देखे, आपकी सड़कें नहीं।` |
| `could.withinView` | `10:52 EST पर WorldView Legion 4 पहुँच के भीतर से गुज़रा, यहाँ से 140 किमी पूर्व में।` |
| `could.insideSwath` | `उसकी 32 किमी चौड़ी पट्टी ने Waterloo को ढका। उसका संचालक यह प्रकाशित नहीं करता कि उसने कहाँ की तस्वीरें लीं, …` |
| `could.camera` | `वह सीधे नीचे से 24.1° मुड़कर Waterloo को देख सकता था। हम नहीं जान सकते कि उसने देखा या नहीं।` |
| `geo.sits` | `Meteosat-12 गुज़रता नहीं। वह 0.2°W पर भूमध्य रेखा से 35,786 किमी ऊपर टिका रहता है और हर 10 मिनट में अपने नीचे की धरती का पूरा चेहरा स्कैन करता है।` |
| `geo.reached` | `इस स्कैन की रेखा करीब 07:49 CET पर Paris तक पहुँची और उत्तर की ओर बढ़ रही थी।` (agrees with `रेखा`, f) |
| `overhead` | `21:04 IST पर ISS (ZARYA) ऊपर से गुज़रा। वह 418 किमी की ऊँचाई पर था, आपके क्षितिज से 40° ऊपर, उत्तर-पश्चिम में।` |
| `darkStation` | `जहाँ आप हैं, वहाँ अंधेरा था। अगर तब भी स्टेशन पर धूप पड़ रही थी, तो वह एक चमकीले, स्थिर बिंदु की तरह आपके आसमान से गुज़रा।` |

`likely.crossed`'s "inside its swath" makes the place the subject of `थी`, which agrees with `जगह` (f): the frame says
`यह जगह`, never `Waterloo थी`. `could.insideSwath` makes the swath the subject (`पट्टी ने … को ढका`) for the same reason.

### 3.5 The four verdicts (`verdicts` namespace)

| Verdict | Title | Lane | Definition | Spoken verb |
|---|---|---|---|---|
| imaged | `देखा गया` | `तस्वीर` | `इस जगह की एक असली तस्वीर किसी सार्वजनिक संग्रह में मौजूद है।` | `देखा` |
| likely | `संभवतः देखा गया` | `संभवतः` | `सीधे नीचे देखने वाले कैमरे की पट्टी इस जगह के ऊपर से गुज़री। इसकी कोई तस्वीर प्रकाशित नहीं हुई है।` | `पट्टी ऊपर से गुज़री` |
| could | `यहाँ देख सकता था` | `मुमकिन` | `मुड़ने वाला या निजी कैमरा पहुँच में था। उसका संचालक नहीं बताता कि उसने इधर देखा या नहीं।` | `पहुँच के भीतर से गुज़रा` |
| overhead | `ऊपर से गुज़रा` | `ऊपर से` | `आपके आसमान से गुज़रा। स्टेशन और बाकी सब कुछ।` | `ऊपर से गुज़रा` |

- The four titles are one gradient on one verb: `देखा गया` (was watched), `संभवतः देखा गया` (probably watched),
  `यहाँ देख सकता था` (could have looked here), `ऊपर से गुज़रा` (passed over). A reader sees at once that they are
  degrees of the same question.
- `देखा गया` is also how Hindi messaging apps mark a message as "Seen". The echo is apt and quietly uncanny, and it is
  the default masculine singular, so it agrees with nothing.
- `संभवतः` ("probably") over `शायद` ("maybe"): the English says likely, and `notYet` says "almost certainly". In the
  lane `संभवतः` stands against `मुमकिन` ("possible"): probable versus possible.
- `यहाँ देख सकता था`: masculine, for the satellite. "Pointed" becomes "looked": the could verdict is about what the
  camera was able to do, and `देख` keeps it on the product's verb.
- The unit after every verdict's count is `बार` ("times"): `देखा गया · 31 बार` reads "watched 31 times". `बार` does not
  change with the number, so readouts need no plural.
- A fixed camera is `सीधे नीचे देखने वाला कैमरा`, a steerable one `मुड़ने वाला कैमरा`: one describes the other.
  Never `स्थिर कैमरा` (that is a stationary camera).

### 3.6 Share card, share page and post

**Card headlines** (blocks: the accent block holds the place and its postposition; the text block the rest):

| Key | Blocks |
|---|---|
| `headline(31, place)` | `*Waterloo को*` · `31 उपग्रहों ने देखा।` |
| `headline(1, place)` | `*Waterloo को*` · `1 उपग्रह ने देखा।` |
| `headlineBy.imaged` | `*Waterloo को*` · `Sentinel-2C ने देखा।` |
| `headlineBy.likely` | `*Waterloo के ऊपर से*` · `Sentinel-2C की पट्टी गुज़री।` |
| `headlineBy.could` | `*Waterloo तक*` · `Sentinel-2C की नज़र पहुँच सकती थी।` |
| `headlineBy.overhead` | `*Waterloo के ऊपर से*` · `Sentinel-2C गुज़रा।` |
| `headlineWeek(31)` | `*Waterloo को*` · `इस हफ़्ते 31 उपग्रहों ने देखा।` (the page title: `Waterloo को इस हफ़्ते 31 उपग्रहों ने देखा।`) |
| `headlineWeek(0)` | `*Waterloo को*` · `इस हफ़्ते हमारी सूची के किसी उपग्रह ने नहीं देखा।` |

- The place leads, in the serif, with its postposition on its line: a line that started with `को` would look broken.
  The danda belongs to the last text block, so a cut place (`…`) never collides with it.
- `likely` and `could` put a feminine noun in the subject (`पट्टी`, `नज़र`), so the verbs agree with a word we chose,
  never with the place or the satellite. "Its swath passed over" is the honest fact; "its gaze could reach" is "passed
  within view of".
- Nameless satellite: `किसी उपग्रह ने`, `किसी उपग्रह की पट्टी`, `किसी उपग्रह की नज़र`, `एक उपग्रह गुज़रा`.

**The post** (`share.post`), plain text, one paragraph per message:

`Sentinel-2C ने रविवार, 1 नवंबर को स्थानीय समयानुसार 11:21 पर 795 किमी की ऊँचाई से Waterloo को देखा। एक पिक्सेल 10
मीटर का है, और यह असली तस्वीर है।`

- `स्थानीय समयानुसार` ("by local time") is the news idiom (`भारतीय समयानुसार`). The day takes `को`.
- Units are spelled in a post (`मीटर`, `किमी`): a post is prose, not a readout.
- The hooks: `किसी चीज़ ने इस हफ़्ते आपको भी देखा।` / `इस हफ़्ते आपके ऊपर से क्या गुज़रा?`; the credit `via @armaangupt0`
  (an X convention, kept).

**The share page's pass description** (`crossed`, `withinView`): with a time, the satellite leads and the date stands
between it and the place (`Sentinel-2C रविवार, 1 नवंबर 2026 को 11:21 EST पर Waterloo के 795 किमी ऊपर से गुज़रा और दक्षिण
की ओर जा रहा था।`); without one, the place leads (`Waterloo के 795 किमी ऊपर से Sentinel-2C गुज़रा।`). `straightDown`
and `offNadir` make the camera the subject, as the pass paragraph does.

**The share page**: `placeTitle`: `Waterloo को इस हफ़्ते किसने देखा` ("who watched Waterloo this week", no danda: a
heading); `question`: `इस हफ़्ते आपको किसने देखा?`. `किसने` is "who / what" as an agent, and asks without gender.

### 3.7 Globe and HUD words

The globe's labels are instrument words: `तस्वीर ली 11:21:13 EST` (IMAGED), `प्राप्त 11:21:13 EST · 10 मी`
(ACQUIRED), `तस्वीर का समय · SENTINEL-2C` (ACQUISITION ·), `सबसे नज़दीकी पल · ISS` (CLOSEST APPROACH ·). The HUD: `कैसे काम
करता है`, `सूरज 16.2°S 063.0°E`, `सूरज के ठीक नीचे`, `16,893 वस्तुएँ · CELESTRAK GP`, `प्राप्त 2026-11-08 03:34Z`,
`42 मिनट पहले`, `पुरानी, 3 दिन पहले`.

## 4. Glossary

### 4.1 Terms

| English | Hindi | Gender | Notes |
|---|---|---|---|
| satellite | उपग्रह | m | Plural `उपग्रह`, oblique plural `उपग्रहों`. Declines naturally; `सैटेलाइट` would force `सैटेलाइट्स`. |
| watched (product verb) | देखना → `देखा`, `देखा गया` | | Never `निगरानी की`, `नज़र रखी`, `फ़ोटो खींची`. |
| image, picture | तस्वीर | f | `तस्वीरें`, `तस्वीरों`. Any kind of image. |
| photo, photograph | फ़ोटो | f | Optical photographs only (`Sentinel-2 और Landsat की फ़ोटो`). |
| pass (an overflight) | उड़ान | f | `उड़ानें`, `उड़ानों`. Never `पास` ("near"). |
| (a count of) passes in a verdict | बार | f | Invariant: `1 बार`, `31 बार`. |
| swath | पट्टी | f | "The strip of ground a fixed camera records": `290 किमी चौड़ी पट्टी`. |
| off-nadir | झुकाव | m | The label; prose `सीधे नीचे से 5.4° हटकर`. |
| straight down (nadir) | सीधे नीचे | | |
| altitude | ऊँचाई | f | `786 किमी की ऊँचाई पर`. |
| elevation (angle above the horizon) | क्षितिज से … ऊपर | | Label `क्षितिज से`, unit `ऊपर`: `क्षितिज से 34° ऊपर`. |
| horizon | क्षितिज | m | |
| sky | आसमान | m | `आपका आसमान`. |
| ground track | ज़मीनी पथ | m | |
| ground speed | ज़मीनी रफ़्तार | f | Prose `… की रफ़्तार से`. |
| heading | दिशा | f | |
| ascending / descending | आरोही / अवरोही | | The heading's unit (`SSW · अवरोही`). Familiar from the `आरोह-अवरोह` of music and school science. |
| field of regard | देखने का दायरा | m | Corner label `दायरा ±30°`. |
| scene (an archive's whole image) | दृश्य | m | `पूरे दृश्य के 25% हिस्से पर बादल`. |
| crop | हिस्सा | m | `संग्रह ने तस्वीर का यह हिस्सा नहीं भेजा।` |
| archive | संग्रह | m | `Sentinel-2 का संग्रह`, `खुला संग्रह`. Never `अभिलेखागार`. |
| open archive | खुला संग्रह | m | |
| publish / published | प्रकाशित करना / प्रकाशित | | `कोई तस्वीर प्रकाशित नहीं हुई है`. |
| made public | सार्वजनिक हुई(ं) | | The second line only. |
| orbit | कक्षा | f | `कक्षाएँ`, `कक्षाओं`. |
| orbital elements | कक्षा के आँकड़े | m pl | "The numbers that describe an orbit". |
| orbit catalog | कक्षाओं की सूची | f | Short `सूची` in labels. |
| object (in the catalog) | वस्तु | f | `16,893 वस्तुएँ`. |
| propagate orbits | कक्षाओं की गणना | f | |
| daily mosaic | दैनिक मोज़ेक | m | `दैनिक` as in the newspapers' names. |
| full disc | पूरी डिस्क | f | |
| geostationary | भूस्थिर | | The standard Hindi term (ISRO, textbooks). |
| weather satellite | मौसम उपग्रह | m | |
| imager | इमेजर | m | "Its VIIRS imager": `इसका VIIRS इमेजर`. |
| camera | कैमरा | m | `कैमरे` oblique. |
| radar | रडार | m | A radar image is `रडार तस्वीर`, never `फ़ोटो`. |
| infrared | इन्फ्रारेड | | Never `अवरक्त` (textbook-only). Chip `IR`. |
| cloud | बादल | m | `बादल छाए` = clouded over; `बादल 25%` = cloud cover. |
| thin cirrus | पतले बादल | m pl | Value `पतले बादल`. |
| cloud shadow | बादल की छाया | f | |
| clear | साफ़ | | |
| spot, your spot (the searched place) | जगह, आपकी जगह | f | |
| place | जगह | f | `इस जगह`, `यह जगह`. |
| position (the device's) | लोकेशन | f | As Indian Hindi apps say it. |
| look (closest look, clear look) | झलक | f | `सबसे नज़दीकी झलक`, `आखिरी साफ़ झलक`, `11 साफ़ झलकें`. |
| frame (time-lapse) | फ़्रेम | m | |
| time-lapse | टाइम-लैप्स | m | |
| replay | रीप्ले | m | The button; known from cricket. |
| share | शेयर करना | | `शेयर करें`. |
| link / post / card | लिंक (m) / पोस्ट (f) / कार्ड (m) | | |
| pixel | पिक्सेल | m | `10 मी प्रति पिक्सेल`, `एक पिक्सेल 10 मीटर का`. |
| operator | संचालक | m | |
| commercial | व्यावसायिक | | |
| private | निजी | | |
| steerable camera | मुड़ने वाला कैमरा | m | |
| fixed camera | सीधे नीचे देखने वाला कैमरा | m | |
| crewed station | मानवयुक्त स्टेशन | m | |
| space station | अंतरिक्ष स्टेशन | m | |
| the Earth | धरती | f | Warm and everyday; `पृथ्वी` is not wrong, but one word throughout. |
| the sun | सूरज | m | `सूर्य` would be the science word; one word throughout, the everyday one. |
| daylight / day / twilight / night | दिन / दिन / धुंधलका / रात | | `धुंधलका` covers dawn and dusk; `गोधूलि` is only dusk. |
| sub-solar point | सूरज के ठीक नीचे | | The HUD label: "directly below the sun". |
| scan, scan line | स्कैन, स्कैन-रेखा | m, f | |
| equator | भूमध्य रेखा | f | |
| fault (the notice's label) | गड़बड़ी | f | |
| stale (catalog) | पुरानी | | Agrees with `सूची`. |
| orbit maths | कक्षाओं की गणना | | |
| geocoder | (named: Photon, Nominatim, Open-Meteo) | | The prose says `सेवा` ("service") with the name. |
| strait | जलडमरूमध्य | m | The geography word, in place names only. |
| cubesat | क्यूबसैट | m | |
| constellation | उपग्रह-समूह | m | |
| panchromatic | श्वेत-श्याम | | "Black-and-white, sharper": `50 सेमी के श्वेत-श्याम पिक्सेल`. |
| multispectral | मल्टीस्पेक्ट्रल | | |
| band | बैंड | m | `C-बैंड रडार`. |

### 4.2 Compass

| id | Word | Where it was (`में`) | Heading (`की ओर`) | Readout |
|---|---|---|---|---|
| n | उत्तर | `उत्तर में` | `उत्तर की ओर` | N |
| ne | उत्तर-पूर्व | `उत्तर-पूर्व में` | `उत्तर-पूर्व की ओर` | NE |
| e | पूर्व | `पूर्व में` | `पूर्व की ओर` | E |
| se | दक्षिण-पूर्व | … | … | SE |
| s | दक्षिण | … | … | S |
| sw | दक्षिण-पश्चिम | … | … | SW |
| w | पश्चिम | … | … | W |
| nw | उत्तर-पश्चिम | … | … | NW |

The 16-point abbreviations (`NNE`, `SSW`) stay Latin: Hindi has no established letters for them, and they sit beside
coordinates that are Latin anyway. `पूर्वोत्तर` is a region's name ("North-East India"), not a direction here.

### 4.3 Curated places (`places` namespace)

The established Hindi name where one exists (`गीज़ा के पिरामिड`, `नियाग्रा जलप्रपात`, `मृत सागर`, `स्वेज़ नहर`,
`यूनान`), otherwise a transliteration as Hindi news writes it. Countries as Hindi readers name them: `अमेरिका` (never
`संयुक्त राज्य अमेरिका` in a sublabel), `यूएई`, `मिस्र`, `तुर्किये`, `दक्षिण अफ़्रीका`. Chips ≤ ~14 characters. The full
table is `src/i18n/hi/places.ts`; the notable choices:

| id | Label | Sublabel | Why |
|---|---|---|---|
| giza | गीज़ा के पिरामिड | गीज़ा, मिस्र | The name every Hindi reader learned. |
| goldenGate | गोल्डन गेट | सैन फ़्रांसिस्को, अमेरिका | |
| washingtonDc | वॉशिंगटन डी.सी. | नेशनल मॉल, अमेरिका | |
| mountStHelens | माउंट सेंट हेलेंस | वॉशिंगटन राज्य, अमेरिका | `राज्य` tells the state from the capital. |
| vesuvius | माउंट विसूवियस | नेपल्स, इटली | The textbook spelling. |
| angkorWat | अंकोरवाट | सिएम रीप, कंबोडिया | Written as one word in Hindi. |
| gardenCity | गार्डन सिटी के गोल खेत | कैनसस, अमेरिका | They are irrigation circles: "round fields" is what they are; "crop circles" would promise something else. |
| deadSea | मृत सागर के नमक तालाब | दक्षिणी बेसिन, इज़राइल और जॉर्डन | |
| gibraltar | जिब्राल्टर | जिब्राल्टर जलडमरूमध्य | |
| everest | माउंट एवरेस्ट | नेपाल और चीन | |

Usage stats, record_lookup and shares keep the English label, so nothing here splits a count.

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: uninflectable, genderless

`[PLACE]` is data from the geocoder or the offline list, nearly always in Latin letters ("Waterloo", "Pacific Ocean",
"Bus stop, Ushuaia"), sometimes in another script. Hindi needs no case ending on it: postpositions are separate words.
The only hazard is gender: a Hindi reader would give `Waterloo` the gender of `शहर` (m) or `नगरी` (f), `Ganga` is
feminine, `Pacific Ocean` masculine, and the code cannot know.

Rules:
1. `[PLACE]` is always followed by a postposition or stands alone: `Waterloo को`, `Waterloo के ऊपर से`, `Waterloo में`,
   `Waterloo तक`, `Waterloo की तस्वीर`, `Waterloo:` (after a colon), a title.
2. `[PLACE]` is never the subject of a verb, adjective or participle that agrees with it. Not `Waterloo साफ़ था`, not
   `Waterloo पट्टी के भीतर थी`. Rewrite with a noun of our own: `यह जगह … थी`, `आपकी जगह पर आसमान साफ़ था`.
3. A possessive after the place agrees with what follows, never with the place: `Waterloo की तस्वीर` (f, for
   `तस्वीर`), `Waterloo के ऊपर`. Always safe.
4. Point back with `यहाँ`, `इस जगह`, `यह जगह` (f, our noun), or `उसके` / `इसके` (no gender). Never `वह` as the place's
   subject.
5. In display lines tie a short postposition to the name with a no-break space (`Waterloo\u00a0को`).
6. English adds "the" before seas and deserts; Hindi has no article: `Pacific Ocean को`.

### 5.2 [SAT]: masculine, and `ने`

Every satellite in the catalog, crewed stations included, is named in Hindi by a masculine noun (`उपग्रह`, `स्टेशन`,
`अंतरिक्ष यान`), so a bare name takes masculine agreement: `Sentinel-2C गुज़रा`, `ISS (ZARYA) गुज़रा`, `वह … जा रहा
था`, `यहाँ देख सकता था`. No head noun is needed; Hindi news writes `ISS भारत के ऊपर से गुज़रा` the same way.

Where the sentence allows, the perfective transitive with `ने` removes agreement entirely: `Sentinel-2C ने Waterloo को
देखा` (the verb is the neutral masculine singular because the object is marked with `को`). Use it for every "watched".
Careful: with `ने` and an unmarked object, the verb agrees with the object (`उसने तस्वीर ली`, f). That is safe when the
object is our own noun (`तस्वीर`, `बादल`), never when it is `[PLACE]`: a place object always takes `को`.

A nameless satellite (`sat` undefined): `एक उपग्रह` as a subject, `किसी उपग्रह ने` with `ने`, `किसी उपग्रह की` as a
possessor, `एक उपग्रह से` after "from". The lone label `aSatellite` (chips, the plan callout) is `एक उपग्रह`.

Two names never collide. `Sentinel-2C ने Waterloo को देखा` keeps the two Latin names apart with `ने`; where no `ने` is
possible, something Hindi stands between them (`Sentinel-2C रविवार, 1 नवंबर 2026 को … Waterloo के ऊपर से गुज़रा`), or the
place leads (`Waterloo के 795 किमी ऊपर से Sentinel-2C गुज़रा`): `Sentinel-2C Waterloo` would read as one name. The same
goes for a name and a number: a clock or an altitude never follows `[SAT]` directly (`Landsat 9 16:14`), so the pass
paragraph opens on the clock (§3.4).

### 5.3 [NUM]: plural categories and the zero rule

Hindi has two CLDR categories, `one` and `other`. Intl puts **0 in `one`** (CLDR's rule is "i = 0 or n = 1", from
fractions such as "0.5 घंटा"), but Hindi counts zero things with the plural: `0 तस्वीरें`, `0 उड़ानें`, `0 घंटे`. Every
file that counts defines

```ts
const pl = <T>(n: number, one: T, other: T) => (n === 0 ? other : f.plural(n, { one, other }))
```

and never calls `f.plural` with a count that can be 0.

Noun forms after a number:

| Noun | 1 | 2+ (direct) | 2+ before a postposition |
|---|---|---|---|
| उपग्रह (m) | 1 उपग्रह | 5 उपग्रह | 5 उपग्रहों ने |
| दिन (m) | 1 दिन | 7 दिन | 7 दिनों में |
| दृश्य (m) | 1 दृश्य | 12 दृश्य | 12 दृश्यों का |
| घंटा (m) | 1 घंटा | 5 घंटे | 5 घंटे पहले (also oblique sg.) |
| तस्वीर (f) | 1 तस्वीर | 27 तस्वीरें | 27 तस्वीरों |
| उड़ान (f) | 1 उड़ान | 31 उड़ानें | 31 उड़ानों से |
| कक्षा (f) | 1 कक्षा | 400 कक्षाएँ | 400 कक्षाओं की |
| वस्तु (f) | 1 वस्तु | 16,893 वस्तुएँ | |
| झलक (f) | 1 साफ़ झलक | 11 साफ़ झलकें | |
| पंक्ति (f) | 1 पंक्ति | 40 पंक्तियाँ | |
| नतीजा (m) | 1 नतीजा | 5 नतीजे | |
| बार, मिनट, सेकंड, मोज़ेक | invariant | | |

- Before a postposition the plural is oblique (`दिनों में`, `उपग्रहों ने`); the singular is unchanged except for `-ā`
  nouns (`1 घंटे में`).
- A verb agrees in number with the count (`1 तस्वीर सार्वजनिक हुई` / `27 तस्वीरें सार्वजनिक हुईं`, `मौसम उपग्रह …
  गुज़रे`).
- `1` stays a digit in readouts and in sentences where the English has the digit. Where the English says "once", Hindi
  says `एक बार`.
- `showAllSats(31)`: `सभी 31 उपग्रह दिखाएँ` ("show all 31 satellites") reads naturally in Hindi, no parentheses needed.
- A number and its noun are tied with a no-break space in strings we build (`\u00a0`); a `num()` part with its unit is
  spaced by the renderer.

### 5.4 Lists of names

`fmt('hi').list` gives `Umbra-08, Capella-14 और 7 दूसरे रडार उपग्रह` (no comma before `और`). A list is plural: its verb
is plural (`… गुज़रे`). One name alone keeps the singular (`Umbra-08 … गुज़रा`).

### 5.5 Dates and times inside sentences

- A day as a slot comes from the `time` namespace: `रवि, 1 नवंबर`. After a day, `को` (`रविवार, 1 नवंबर को`); in prose use
  the long weekday.
- "Between A and B": `A से B के बीच` (`29 अक्टूबर से 5 नवंबर के बीच`).
- A clock takes `पर`: `16:14 UTC पर`; "at about": `करीब 07:49 CET पर`.
- "In the last 7 days": `पिछले 7 दिनों में`; the kicker without a postposition: `पिछले 7 दिन`.
- Relative times from Intl's long style: `12 मिनट पहले`, `30 घंटे पहले`, `3 दिन पहले`, `3 घंटे में`; "just now" is
  `अभी-अभी`. The short style's `मि॰` / `घं॰` are not used.

### 5.6 Formatted slots

Coordinates (`43.4723°N 80.5449°W`), clocks, zones, ISO stamps and compass abbreviations arrive written and stay as they
are, in Latin. A Devanagari word next to one is separated by a space.

## 6. Typography and formatting

### 6.1 Punctuation

- **The danda `।`** (U+0964) ends every sentence of running copy: body text, headlines, footnotes, alt text, posts,
  page descriptions, spoken summaries. Attached to the last word, a space after it. Never `.` as a sentence end, never
  the double danda `॥`.
- A sentence should end on a Hindi word (Hindi is verb-final, so it nearly always does). Where a number would end it
  (`बादल: 25%।`), rebuild it (`पूरे दृश्य के 25% हिस्से पर बादल थे।`).
- `?` ends a question (`क्या यह लाइव है?`). No `!` anywhere.
- `,` and `:` as in English. No `;` in Hindi prose: split the sentence, or join with `, और` / `, इसलिए` / `, पर`.
- Quotation marks “ ” (`“${query}”`), and `‘ ’` inside them. Never ASCII `"`.
- `…` (U+2026) after a progressive status (`तस्वीर बन रही है…`).
- `·` and `→` are the design's separators and keep their role; `/` in `01 / जगह`.
- Labels, buttons, chips and titles take no final mark.

### 6.2 Spelling

- Nukta on `ज़` and `फ़` always: `हफ़्ता`, `ज़मीन`, `ज़ूम`, `फ़ोटो`, `फ़्रेम`, `फ़ाइल`, `रफ़्तार`, `साफ़`, `ज़रूरत`. Never
  on `क ख ग` (`आखिरी`, `करीब`, `खराब`): most Hindi readers do not pronounce them apart, and most Hindi papers drop them.
- Chandrabindu where nothing sits above the headline: `यहाँ`, `वहाँ`, `कहाँ`, `पहुँच`, `ऊँचाई`, `आँकड़े`, `माँग`,
  `ढूँढ`. Anusvara where something does: `में`, `हैं`, `नहीं`, `तस्वीरें`, `उड़ानें`, `करें`.
- Anusvara for a nasal before a consonant: `अंदर`, `संबंध`, `ठंड`, `हिंदी`.
- `ई` / `ि` and `ऊ` / `ु` as the dictionary has them: `जानकारी`, `गुज़री`, `पूरी`, `दूरी`.
- Hyphens join compounds and echo words: `उत्तर-पूर्व`, `अभी-अभी`, `श्वेत-श्याम`, `टाइम-लैप्स`, `स्कैन-रेखा`.
- English loanwords as Hindi news spells them: `ब्राउज़र`, `कनेक्शन`, `डाउनलोड`, `पिक्सेल`, `वीडियो`, `ऑस्ट्रेलिया`.

### 6.3 Spaces

- A no-break space (written `\u00a0`) between a number and its unit or noun in strings we build: `786\u00a0किमी`,
  `7\u00a0दिनों`, `27\u00a0तस्वीरें`.
- Between `[PLACE]` and a short postposition in display lines (`Waterloo\u00a0को`).
- No space before `।`, `?`, `,`, `:`, `%`, `°`.

### 6.4 Numbers

- `fmt('hi').int` / `.dec` / `.pct`: Western digits, `.` for decimals, and Intl's Indian grouping, which is what an
  Indian reader expects (`1,715`, `16,893`, `12,34,567`). Never `toLocaleString('en-US')`.
- Decimals where the English has them (`7.46`, `5.4°`); the English `toFixed` forms become `f.dec(x, digits)`.
- A minus is U+2212 where the English has one.

### 6.5 Dates

From Intl (`hi`), never a table:

| Use | Options | Example |
|---|---|---|
| `day` (pass rows, captions, HUD) | `{ weekday: 'short', day: 'numeric', month: 'long' }` | `रवि, 1 नवंबर` |
| `weekdayShort` | `{ weekday: 'short' }` | `रवि` |
| `dayCompact` (≤ 5) | weekday + day | `रवि 1` |
| `dayMonth` | `{ day: 'numeric', month: 'long' }` | `1 नवंबर` |
| `daySpoken` | `{ weekday: 'long', day: 'numeric', month: 'long' }` | `रविवार, 1 नवंबर` |
| with year (card, time-lapse) | `+ year: 'numeric'` | `1 नवंबर 2026` |
| `dayRange` | built from parts | `1 → 8 नवंबर`, `29 अक्टूबर → 5 नवंबर` |

Full month names everywhere: Hindi months are short words (`मई`, `जून`, `नवंबर`), and CLDR's `नव॰`, `अक्टू॰` with the
abbreviation sign read as forms, not as copy.

### 6.6 Time

24 h clocks with their zone abbreviation, never `बजे`, `सुबह`, `शाम`, `रात` around them. In prose `16:14 UTC पर`; a post
says `स्थानीय समयानुसार 11:21 पर`. Durations in words: `38 सेकंड`, `4 मिनट 12 सेकंड`, `1 घंटा 02 मिनट`, `2 घंटे 05
मिनट`.

### 6.7 Line breaking

Devanagari breaks at spaces. A postposition left at a line start (`को देखा।`) looks like a fragment; in display lines
(the hero, the headline, the card) keep it with its noun by a no-break space, and in body text accept the break. Never
break inside a word, and never hyphenate Hindi.

### 6.8 Mono labels and the script

Devanagari has no case: `text-transform: uppercase` leaves it as it is and uppercases only the Latin inside a label
(`SENTINEL-2C`), which is what English does too. Store labels as written. Units stay lowercase anyway.

For whoever tunes `html[data-script="devanagari"]` (not in this guide's files):
- **Letter-spacing 0** on Devanagari, mono labels included: tracking cuts the headline stroke (शिरोरेखा) between letters
  and breaks conjuncts apart. The mono caps rows' +0.08em must not apply.
- **More leading**: vowel signs sit above the headline (`ि`, `ी`, `े`, `ै`, `ं`) and below the baseline (`ु`, `ू`,
  `ृ`); the display face's 0.92 line height clips them. Hindi wants at least ×1.3 in display lines, ×1.5 in body text.
- Martian Mono has no Devanagari, so mono labels fall to the Devanagari face: their widths are proportional, not cells.
- The display face's condensed width has no Devanagari counterpart in most families; a condensed Latin next to a normal
  Devanagari reads mismatched, so the headline's Devanagari should be the family's narrowest true width.
- The serif accent (`आपको`, the place) needs a Devanagari face with a distinct, calligraphic voice; Devanagari has no
  italic, so `font-synthesis-style: none` (a slanted Devanagari reads as a mistake).

## 7. Length discipline

Hindi in Devanagari runs about as many characters as English, but each character is wider at the same size and the
vowel signs need height: expect running prose **10–25% wider** than English, and short labels anywhere from shorter
(`तस्वीर` for "Image") to half again as wide (`फिर कोशिश करें` for "Try again"). Mono budgets in the English comments
are Latin character counts in a monospaced face; in Hindi they are a width, checked on screen.

Strategies, in order:
1. A noun instead of a verb phrase in labels (`रीप्ले`, `ऊँचाई`, `झुकाव`, `गड़बड़ी`).
2. Drop what the screen already shows: the share sheet's buttons sit under the link and the post, so `कॉपी करें` is
   not needed twice.
3. The established short word (`रीप्ले` over `दोबारा चलाएँ`, `IR`, `किमी`).
4. No `कृपया`, no `यहाँ क्लिक करें`, no possessive the screen implies.
5. Never truncate a Hindi word or invent an abbreviation. The only abbreviations are the units (`किमी`, `मी`, `सेमी`,
   `किमी/से`).

| English | Hindi | Note |
|---|---|---|
| SURPRISE ME | मुझे चौंकाएँ | The reader's own request, as the English is. |
| USE MY LOCATION | मेरी लोकेशन इस्तेमाल करें | Phones: `मेरी लोकेशन`; ≤ 400 px chip: `मेरे आसपास`. |
| HOW THIS WORKS | कैसे काम करता है | Beside `सूरज 16.2°S 063.0°E` on a 375 px phone. |
| LAST 7 DAYS | पिछले 7 दिन | |
| CLOSEST LOOK | सबसे नज़दीकी झलक | ≤ 20 |
| LAST CLEAR LOOK | आखिरी साफ़ झलक | |
| CLOUDED OVER | बादल छाए | |
| TIME-LAPSE | टाइम-लैप्स | |
| OFF-NADIR | झुकाव | |
| PIXEL / MOSAIC PIXEL | पिक्सेल / मोज़ेक पिक्सेल | |
| SHARE | शेयर करें | |
| SHARE IMAGE | तस्वीर शेयर करें | Full-width phone button. |
| COPY LINK | लिंक कॉपी करें | One of three on a 360 px phone: checked on screen. |
| POST TO X | X पर पोस्ट करें | |
| SAVE PNG | PNG सेव करें | |
| COPIED | कॉपी हो गया | |
| TRY AGAIN | फिर कोशिश करें | |
| REPLAY | रीप्ले | |
| LINK / POST (48 px column) | लिंक / पोस्ट | |
| Filter: ALL · DETAILED · WEATHER · RADAR | सभी · बारीक · मौसम · रडार | `बारीक` = fine detail; `विस्तृत` would read "extensive". |
| Lanes | तस्वीर · संभवतः · मुमकिन · ऊपर से | |

## 8. Sensitive content

- **Surveillance.** The product is about being watched, and Indian readers know the debates about phone surveillance
  and data. The product verb is the plain `देखना`. `निगरानी` (surveillance), `नज़र रखना` (keep under watch), `जासूसी`
  (spying) and `ट्रैक करना` never describe what Watched or a satellite does. "Military and spy satellites" in About is
  `सैन्य और जासूसी उपग्रह`: there the English names them, and Hindi does too.
- **Borders.** India's borders with Pakistan and China are disputed, and maps are a legal matter in India. Nothing in
  this catalog names a border or a disputed region. Place names and the country at the end of a "where" line come from
  the geocoder and the browser (data, not copy); if the owner wants a policy for Kashmir or Arunachal Pradesh, it is a
  data decision (`src/imagery/exonyms.ts`), not a translation one.
- **Strikes and war imagery.** Hindi readers saw satellite images of strikes in May 2025. Keep the plain verbs: a
  satellite `गुज़रा`, `देखा`, its camera `मुड़ सकता था`; never `निशाना` (target), `लक्ष्य साधना`, `हमला`.
- **ISRO.** Indian satellites (Cartosat, RISAT, INSAT) are named as their operator writes them, in Latin, like every
  other: no national pride words, no `हमारा`.
- **Religion and caste.** No idiom with a religious source (`भगवान जाने`, `राम भरोसे`, `ऊपर वाला देख रहा है`), however
  tempting "someone up there is watching" is for this product.
- **Privacy text** is translated exactly: promise nothing more or less than the English.

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends and ambiguous words

| Word | Trap | Use |
|---|---|---|
| पास | "near", not a satellite pass | `उड़ान`, `बार` |
| दृश्य | also "view, sight"; fine for a scene, wrong for "visible" | `दृश्य प्रकाश` for the visible band |
| विस्तृत | "extensive, elaborate" | `बारीक` for detailed imagery |
| स्थिर कैमरा | a stationary camera | `सीधे नीचे देखने वाला कैमरा` |
| ऊँचाई | altitude, but also height of the sun's angle | `ऊँचाई` for km; `क्षितिज से … ऊपर` for an elevation; `सूरज की ऊँचाई` with degrees |
| निगरानी, नज़र रखना | surveillance | `देखना` |
| फ़ोटो खींचना | "take a photo", wrong for radar and mosaics | `तस्वीर ली`, `देखा` |
| सैटेलाइट्स | Hinglish plural | `उपग्रह` |
| बजे | spoken hours | `पर` after a 24 h clock |
| कृपया | officialese | nothing |
| ट्रैक करना | tracking a person | `हमारी सूची` for "we track" |

### 9.2 Reviewer's checklist (run it on every string)

1. Is `आप` ever the subject of a gendered participle? Rewrite.
2. Does any verb, adjective or participle agree with `[PLACE]`? Rewrite with `यह जगह` or a postposition.
3. Does a place object take `को`? (`ने` + unmarked place object would agree with the place.)
4. Is a count that can be 0 sent through `pl`, and is the noun oblique before a postposition?
5. Does every sentence end with `।`, and every label with nothing?
6. Is every number and unit tied, and does a display line keep its postposition with its noun?
7. Is `तस्वीर` used for anything that is not an optical photo?
8. Is there a word of officialese (`कृपया`, `पुनः`, `द्वारा`) or Hinglish (`-स` plurals, English verbs with `करना` that
   Hindi interfaces do not use)?
9. Nukta on ज़ / फ़, none on क ख ग; chandrabindu vs anusvara.
10. Does it fit: read it on screen at 390 px and 1280 px.

### 9.3 Test values

Places: `Waterloo`, `Pacific Ocean`, `Bus stop, Ushuaia, Tierra del Fuego`, `Ganga` (feminine to a Hindi reader),
`Washington, D.C.` (ends on a full stop), a 120-character name, `東京`. Satellites: `Sentinel-2C`, `ISS (ZARYA)`,
`NORAD 60989`, undefined. Counts: 0, 1, 2, 5, 21, 1,715, 1,23,456.

## Decisions log

| # | Question | Decision |
|---|---|---|
| 1 | `उपग्रह` or `सैटेलाइट` | `उपग्रह`: the school and news word, declines (`उपग्रहों ने`), short in Devanagari. `सैटेलाइट` is common in speech, but its plural is Hinglish. |
| 2 | `आप` or `तुम` | `आप`: the only address an Indian product uses with a stranger. Gender handled by the `-एँ` imperative and the copula (§1.2). |
| 3 | Product verb | `देखना`, with `ने`: no agreement with the satellite or the count. |
| 4 | "Pass" | `उड़ान` as the noun, `बार` as the verdicts' unit. `पास` means "near". |
| 5 | Image vs photo | `तस्वीर` for every image, `फ़ोटो` for optical photographs (honest labelling: radar is not a photo). |
| 6 | Zero | Plural, against Intl's `one` (§5.3). |
| 7 | Digits and grouping | Western digits; Intl's Indian grouping kept. |
| 8 | Units | Devanagari `किमी`, `मी`, as Hindi papers print them. |
| 9 | Danda | `।` in all running copy, no space before. |
| 10 | Nukta | ज़ and फ़ only. |
| 11 | Dates | CLDR via Intl, full month names. |
| 12 | Compass readouts | Latin abbreviations; Hindi words in prose. |
| 13 | Agency names | Latin (`NASA`), as the product keeps every agency name; Hindi news would write `नासा`, which a reviewer may prefer in prose. |
| 14 | Card headline order | Place first, with its postposition, in the serif; then the count phrase. |
| 15 | Ascending / descending | `आरोही` / `अवरोही`. |
| 16 | Clock position in the pass paragraph | First (`16:14 EST पर Landsat 9 …`), so a name ending in a number never runs into it (§3.4). |
| 17 | The computing readout's status mark | `OK`, in Latin: beside a duration in words (`0.24 सेकंड`), a Hindi `ठीक` read as part of it. |
| 18 | The pass list's "Latest" / "Closest" | `आखिरी बार:` / `सबसे नज़दीक:`, with a colon: `आखिरी सोम` reads "the last Monday", `सबसे नज़दीक झुकाव` "the nearest tilt". |
| 19 | Open questions for the native review | `मुमकिन` vs `संभव` as the could lane; `रीप्ले` vs `दोबारा देखें`; `मुझे चौंकाएँ` vs `कोई भी जगह`; whether `नासा` should replace `NASA` in prose. |
