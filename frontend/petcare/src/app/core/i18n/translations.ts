/**
 * Union of every translation key used across the application. Adding a new
 * key here (and the matching entry in both {@link EN} and {@link BG}) yields
 * compile-time validation at every call site.
 */
export type TranslationKey =
  | 'nav.ads'
  | 'nav.createAd'
  | 'nav.inbox'
  | 'nav.account'
  | 'nav.settings'
  | 'nav.role'
  | 'nav.logout'
  | 'nav.login'
  | 'nav.register'
  | 'nav.highContrastOn'
  | 'nav.highContrastOff'
  | 'nav.language'
  | 'nav.langEn'
  | 'nav.langBg'
  | 'nav.weather'
  | 'settings.title'
  | 'settings.back'
  | 'settings.session.title'
  | 'settings.session.help'
  | 'settings.session.timeoutLabel'
  | 'settings.session.disabled'
  | 'settings.session.enabledPrefix'
  | 'settings.session.minutesSuffix'
  | 'common.refresh'
  | 'common.loading'
  | 'common.simpleView'
  | 'common.standardView'
  | 'ads.title'
  | 'ads.subtitle'
  | 'ads.filterCity'
  | 'ads.loadMore'
  | 'ads.noMore'
  | 'ads.showing'
  | 'inbox.title'
  | 'inbox.newMessage'
  | 'inbox.inboxTab'
  | 'inbox.sentTab';

/** Map from translation key to the translated string. */
export type Translations = Record<TranslationKey, string>;

/** English translations. */
export const EN: Translations = {
  'nav.ads': 'Ads',
  'nav.createAd': 'Create ad',
  'nav.inbox': 'Inbox',
  'nav.account': 'Account',
  'nav.settings': 'Settings',
  'nav.role': 'Role',
  'nav.logout': 'Logout',
  'nav.login': 'Login',
  'nav.register': 'Register',
  'nav.highContrastOn': 'High contrast',
  'nav.highContrastOff': 'Normal contrast',
  'nav.language': 'Language',
  'nav.langEn': 'English',
  'nav.langBg': 'Bulgarian',
  'nav.weather': 'Weather',
  'settings.title': 'Settings',
  'settings.back': 'Back',
  'settings.session.title': 'Session',
  'settings.session.help': 'By default the session timer is disabled. If you enable it, you will be logged out after the selected time from login.',
  'settings.session.timeoutLabel': 'Session timeout',
  'settings.session.disabled': 'Session timer is disabled.',
  'settings.session.enabledPrefix': 'Session timer enabled:',
  'settings.session.minutesSuffix': 'minutes (from login).',
  'common.refresh': 'Refresh',
  'common.loading': 'Loading…',
  'common.simpleView': 'Simple view',
  'common.standardView': 'Standard view',
  'ads.title': 'Find trusted pet care in Bulgaria',
  'ads.subtitle': 'Browse ads on the map, open details, and (if you are a Seeker) create your own ad.',
  'ads.filterCity': 'Filter by city (e.g. Sofia)',
  'ads.loadMore': 'Load more',
  'ads.noMore': 'No more',
  'ads.showing': 'Showing',
  'inbox.title': 'Inbox',
  'inbox.newMessage': 'New Message',
  'inbox.inboxTab': 'Inbox',
  'inbox.sentTab': 'Sent',
};

/** Bulgarian translations. */
export const BG: Translations = {
  'nav.ads': 'Обяви',
  'nav.createAd': 'Създай обява',
  'nav.inbox': 'Съобщения',
  'nav.account': 'Акаунт',
  'nav.settings': 'Настройки',
  'nav.role': 'Роля',
  'nav.logout': 'Изход',
  'nav.login': 'Вход',
  'nav.register': 'Регистрация',
  'nav.highContrastOn': 'Висок контраст',
  'nav.highContrastOff': 'Нормален контраст',
  'nav.language': 'Език',
  'nav.langEn': 'Английски',
  'nav.langBg': 'Български',
  'nav.weather': 'Време',
  'settings.title': 'Настройки',
  'settings.back': 'Назад',
  'settings.session.title': 'Сесия',
  'settings.session.help': 'По подразбиране таймерът за сесия е изключен. Ако го включите, ще бъдете излезли след избраното време от момента на вход.',
  'settings.session.timeoutLabel': 'Време на сесия',
  'settings.session.disabled': 'Таймерът за сесия е изключен.',
  'settings.session.enabledPrefix': 'Таймерът за сесия е включен:',
  'settings.session.minutesSuffix': 'минути (от вход).',
  'common.refresh': 'Обнови',
  'common.loading': 'Зареждане…',
  'common.simpleView': 'Лесен изглед',
  'common.standardView': 'Стандартен изглед',
  'ads.title': 'Намерете надеждна грижа за домашни любимци в България',
  'ads.subtitle': 'Разгледайте обявите на картата, отворете детайли и (ако сте Seeker) създайте своя обява.',
  'ads.filterCity': 'Филтър по град (напр. София)',
  'ads.loadMore': 'Още',
  'ads.noMore': 'Край',
  'ads.showing': 'Показани',
  'inbox.title': 'Съобщения',
  'inbox.newMessage': 'Ново съобщение',
  'inbox.inboxTab': 'Входящи',
  'inbox.sentTab': 'Изпратени',
};

