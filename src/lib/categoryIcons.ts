import type { IconName } from '../components/Icon';

// Категорії (`categories` у БД) редагуються з адмінки — slug може бути
// будь-яким, тож тримаємо мапу під відомі на зараз + розумний фолбек для
// всього нового, що адмін додасть пізніше (щоб ніколи знову не впасти на
// emoji-поле з БД). Той самий підхід, що й у мобільному застосунку/адмінці.
const CATEGORY_ICON: Record<string, IconName> = {
  machines: 'coffeeCup',
  'home-machines': 'home',
  grinders: 'grinder',
  beans: 'bean',
  accessories: 'toolbox',
};

export function categoryIcon(slug: string | null | undefined): IconName {
  return (slug && CATEGORY_ICON[slug]) || 'package';
}
