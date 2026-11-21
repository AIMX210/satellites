/**
 * Russian copy for the About page (see docs/i18n/ru.md §3.9): every heading, paragraph, fact, credit and key.
 *
 * Why it reads this way: About is the owner's plain voice, so it talks to one person with ты and keeps the answers
 * short («Меня видно? Нет.»); the product is мы. No sentence has ты as the subject of a past tense or a short adjective
 * (the reader's gender is unknown, §1.4): «Если твоё место было в досягаемости», «Нужно оказаться в этой полосе»,
 * «выбранный пролёт». The privacy rows are translated exactly, promising nothing more or less than the English. The em
 * dash appears only where Russian grammar puts it (noun — noun, a missing verb: «Автомобиль — это один пиксель», «у
 * Landsat — 185 км»), with an NBSP before it. The catalog line splits into two sentences so the count changes only its
 * noun («1 объект · 2 объекта · 5 объектов»). Licence lines, product, agency and person's names stay as they are;
 * OpenStreetMap's credit takes the form OSM gives for Russian. The Type credit names the Cyrillic faces too, because a
 * ru reader sees Noto, not Instrument.
 */
import type en from '../en/about'
import type { AboutPart, LinkPart } from '../en/about'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, type Part, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('ru')

const link = (...parts: Part[]): LinkPart => ({ link: parts })

/** A count as it is set: grouped («16 893»), a fraction kept (its plural form is `other`). */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

const about: typeof en = {
  bar: 'О проекте',
  close: 'Закрыть',
  sectionsLabel: 'Разделы',
  title: [['Как это'], [accent('работает'), '.']] as Rich[],
  lede: 'Выбери точку на Земле. Мы вычисляем, какие спутники пролетали над ней за последнюю неделю, и ищем снимки, которые они сделали. Всё работает в твоём браузере, на открытых данных.',

  sections: {
    short: 'Коротко',
    method: 'Как мы находим пролёты',
    words: 'Что значат отметки',
    accuracy: 'Чего мы не видим',
    privacy: 'Приватность',
    credits: 'Благодарности',
    keys: 'Клавиатура',
  },

  short: {
    live: {
      term: 'Это в реальном времени?',
      text: 'Не совсем. Снимки попадают в архивы через несколько часов или пару дней после съёмки, так что у самых свежих пролётов их может ещё не быть.',
    },
    seeMe: {
      term: 'Меня видно?',
      text: 'Нет. Самый мелкий пиксель здесь\u00a0— 10\u00a0м. Автомобиль\u00a0— это один пиксель. Тебя на снимке не видно.',
    },
    every: {
      term: 'Здесь все спутники?',
      text: 'Нет. Военных и разведывательных спутников в основном нет в открытых каталогах, а компании не говорят, куда направляют свои камеры.',
    },
  },

  method: {
    orbits: [
      'У каждого объекта на орбите есть открытый набор чисел, который описывает его путь. ',
      link('CelesTrak'),
      ' публикует эти наборы по данным наблюдений Космических сил США, а мы берём свежую копию каждые шесть часов.',
    ] as AboutPart[],
    loaded: (n: number, stamp: string): AboutPart[] => [
      'Эта страница загрузила ',
      num(count(n)),
      `\u00a0${f.plural(n, { one: 'объект', few: 'объекта', many: 'объектов', other: 'объекта' })}. Каталог получен `,
      num(stamp),
      '.',
    ],
    sgp4: 'Мы прогоняем каждый спутник через SGP4, стандартную модель орбит, за последние семь дней и отмечаем каждый момент, когда твоя точка была в поле его зрения.',
    facts: {
      straightDown: {
        term: 'Строго вниз',
        text: 'Sentinel-2 и Landsat смотрят строго вниз на полосу земли: у Sentinel-2 она шириной около 290\u00a0км, у Landsat\u00a0— 185\u00a0км. Нужно оказаться в этой полосе.',
      },
      tilting: {
        term: 'Поворотные камеры',
        text: 'Многие коммерческие спутники могут отклоняться на 30–\u206045\u00a0градусов. Если твоё место было в досягаемости, мы пишем «Могли смотреть сюда».',
      },
      daylight: {
        term: 'Дневной свет',
        text: 'Обычным камерам нужно солнце. Пролёт в темноте никогда не засчитывается как фото.',
      },
      radar: {
        term: 'Радар',
        text: 'Спутнику Sentinel-1 солнце не нужно. Он излучает микроволны и записывает эхо, поэтому видит сквозь облака и ночью, глядя в сторону от своей трассы. Его снимки тоже публикуют, поэтому мы их показываем, в оттенках серого: светлое\u00a0— это неровная земля и здания, тёмное\u00a0— спокойная вода.',
      },
      weather: {
        term: 'Метеоспутники',
        text: 'Несколько висят над экватором и каждые 10\u00a0минут смотрят на полпланеты. Если ты на их стороне Земли, ты в каждом кадре.',
      },
    },
    archives:
      'Затем мы ищем в архивах снимков (Microsoft Planetary Computer, Element 84 и NASA) и сопоставляем каждый снимок с пролётом, во время которого он сделан. Каждый снимок, который ты видишь, настоящий: он обрезан вокруг твоей точки.',
    photoFacts: {
      touchUps: {
        term: 'Обработка',
        text: 'Для твоего экрана мы выравниваем цвета фото Sentinel-2 и Landsat, сглаживаем их и слегка повышаем резкость, одинаково по всему снимку. Ничего не добавляем и не убираем.',
      },
      whichWayUp: {
        term: 'Где север',
        text: 'Фото Sentinel-2 и Landsat сохраняют собственную картографическую сетку архива для твоего места, поэтому север может отклоняться от верха на несколько градусов. Открой фото, и его стрелка N покажет, где именно север.',
      },
    },
  },

  verdictMore: {
    imaged: 'Если мы его показываем, это настоящий снимок.',
    likely: 'Возможно, он ещё не вышел или его отбраковали из-за облаков.',
    could: 'Узнать, так ли было на самом деле, невозможно.',
    overhead: '',
  },

  accuracy: {
    positions: {
      term: 'Точные положения',
      text: 'Открытые данные об орбитах точны примерно до километра и каждый день понемногу теряют точность. Время может отличаться на несколько секунд.',
    },
    secret: {
      term: 'Секретные спутники',
      text: 'Некоторые из лучших камер на орбите принадлежат военным. Здесь их нет.',
    },
    clouds: {
      term: 'Облака',
      text: 'Многие фото\u00a0— это просто облака. Если архив сообщает об облачности, мы проверяем пиксель точно над твоей точкой и говорим об этом.',
    },
    delays: { term: 'Задержки', text: 'Фото может появиться через день-два.' },
  },

  privacy: {
    where: { term: 'Где это работает', text: 'Расчёт орбит идёт в твоём браузере.' },
    kept: {
      term: 'Что мы храним',
      text: 'Мы считаем поиски по населённому пункту и по участку примерно 10\u00a0км, но никогда не по твоему точному местоположению, и ведём подсчёт того, что открывают и чем делятся. Никаких IP-адресов, никаких собственных файлов cookie, ничего, что связывало бы один визит со следующим.',
    },
    others: {
      term: 'Кто ещё это видит',
      text: 'Большинство названий мест берётся из списка, встроенного в сайт. Остальные поисковые запросы уходят в Open-Meteo, Photon или Nominatim. Снимки загружаются напрямую из архивов. Наш хостинг без файлов cookie считает просмотры страниц и измеряет скорость, а также может установить один защитный файл cookie, чтобы отличать людей от ботов. Мы его никогда не читаем.',
    },
    links: {
      term: 'Ссылки, которыми делятся',
      text: 'Создаются, только когда ты чем-то делишься. Любой, у кого есть ссылка, видит название места, точку, округлённую примерно до 1\u00a0км, и выбранный пролёт.',
    },
  },

  credits: {
    madeBy: { who: 'Автор', text: (handle: string): AboutPart[] => ['Armaan, ', link(handle), ' в X'] },
    gibs: 'Снимки из NASA GIBS, части EOSDIS. GOES\u00a0— через NOAA и CIRA, Himawari\u00a0— через JMA.',
    archives: {
      who: 'Архивы',
      text: 'Microsoft Planetary Computer и Element 84 Earth Search; 15-метровый канал Landsat\u00a0— из Copernicus Data Space Ecosystem.',
    },
    orbits: { who: 'Орбиты', text: 'Наборы элементов от CelesTrak. SGP4 из библиотеки satellite.js.' },
    placeNames: { who: 'Названия мест', text: 'Photon от komoot. Данные карты © участники OpenStreetMap (ODbL).' },
    textures: { who: 'Текстуры Земли', text: 'Solar System Scope (CC BY 4.0), на основе NASA Blue Marble и Black Marble.' },
    type: {
      who: 'Шрифты',
      text: 'Instrument Sans и Serif от Instrument, Martian Mono от Evil Martians, Noto Sans и Noto Serif Display от Google для кириллицы (SIL OFL).',
    },
  },

  keys: {
    search: 'Найти место',
    suggestions: 'Перейти по подсказкам',
    choose: 'Выбрать',
    passes: 'Листать пролёты',
    photos: 'Предыдущий / следующий снимок',
    expand: 'Развернуть снимок',
    zoom: 'Масштаб (в развёрнутом виде)',
    play: 'Запустить или остановить повтор',
    back: 'Назад или закрыть',
    help: 'Эта страница',
  },
  keyNames: { enter: 'Enter', space: 'Пробел', esc: 'Esc' },

  builtBy: (handle: string): AboutPart[] => ['Автор\u00a0— ', link(handle)],
  footerNote: 'Сделано из открытых данных. Ни одного из этих снимков мы не делали.',
}
export default about
