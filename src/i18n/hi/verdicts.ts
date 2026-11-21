/**
 * The ONE verdict vocabulary in Hindi (see docs/i18n/hi.md §3.5, §4.1): every screen that names a verdict reads it
 * from here, so «देखा गया» on the summary, the timeline, the pass list and About is one phrase everywhere.
 *
 * Why these forms: the four titles are one gradient on the product's verb, so a reader sees degrees of one question:
 * «देखा गया» (was watched; also how Hindi messengers mark a message "Seen"), «संभवतः देखा गया» (probably watched),
 * «यहाँ देख सकता था» (could have looked here), «ऊपर से गुज़रा» (passed over). Each is the default masculine, which is
 * also the satellite's gender (§5.2), so none guesses anything. The lanes pair «संभवतः» (probable) with «मुमकिन»
 * (possible). Every verdict counts passes, and Hindi counts them as times: «31 बार», invariant, so «देखा गया · 31 बार»
 * reads "watched 31 times". A fixed camera is «सीधे नीचे देखने वाला कैमरा», a steerable one «मुड़ने वाला कैमरा»:
 * never «स्थिर», which is a camera that stands still. The spoken verb follows a bare satellite name in a comma list.
 */
import type en from '../en/verdicts'

/** «1 बार», «31 बार»: every verdict counts passes as times */
const times = () => 'बार'

const verdicts: typeof en = {
  imaged: {
    title: 'देखा गया',
    short: 'तस्वीर',
    unit: times,
    definition: 'इस जगह की एक असली तस्वीर किसी सार्वजनिक संग्रह में मौजूद है।',
    verb: 'देखा',
  },
  likely: {
    title: 'संभवतः देखा गया',
    short: 'संभवतः',
    unit: times,
    definition: 'सीधे नीचे देखने वाले कैमरे की पट्टी इस जगह के ऊपर से गुज़री। इसकी कोई तस्वीर प्रकाशित नहीं हुई है।',
    verb: 'पट्टी ऊपर से गुज़री',
  },
  could: {
    title: 'यहाँ देख सकता था',
    short: 'मुमकिन',
    unit: times,
    definition: 'मुड़ने वाला या निजी कैमरा पहुँच में था। उसका संचालक नहीं बताता कि उसने इधर देखा या नहीं।',
    verb: 'पहुँच के भीतर से गुज़रा',
  },
  overhead: {
    title: 'ऊपर से गुज़रा',
    short: 'ऊपर से',
    unit: times,
    definition: 'आपके आसमान से गुज़रा। स्टेशन और बाकी सब कुछ।',
    verb: 'ऊपर से गुज़रा',
  },
}
export default verdicts
