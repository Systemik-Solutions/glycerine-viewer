import { createI18n } from 'vue-i18n'
import en from '@/i18n/langs/en.js';
import de from '@/i18n/langs/de.js';
import es from '@/i18n/langs/es.js';
import fr from '@/i18n/langs/fr.js';
import it from '@/i18n/langs/it.js';
import nl from '@/i18n/langs/nl.js';
import zh from '@/i18n/langs/zh.js';
import da from '@/i18n/langs/da.js';
import el from '@/i18n/langs/el.js';
import fi from '@/i18n/langs/fi.js';
import hi from '@/i18n/langs/hi.js';
import ja from '@/i18n/langs/ja.js';
import ko from '@/i18n/langs/ko.js';
import no from '@/i18n/langs/no.js';
import pl from '@/i18n/langs/pl.js';
import pt from '@/i18n/langs/pt.js';
import ru from '@/i18n/langs/ru.js';
import sv from '@/i18n/langs/sv.js';
import vi from '@/i18n/langs/vi.js';

export default createI18n({
    locale: localStorage.getItem('prefLang') || 'en',
    fallbackLocale: 'en',
    messages: { en, de, es, fr, it, nl, zh, da, el, fi, hi, ja, ko, no, pl, pt, ru, sv, vi },
})
