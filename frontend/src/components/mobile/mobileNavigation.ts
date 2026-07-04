import type { AnchorId } from '../../types';

export interface MobileNavItem {
  target: AnchorId;
  labelEn: string;
  labelZh: string;
}

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { target: 'home', labelEn: 'INDEX', labelZh: '首页' },
  { target: 'about', labelEn: 'INFORMATION', labelZh: '情报' },
  { target: 'groups', labelEn: 'GROUPS', labelZh: '小组' },
  { target: 'activities', labelEn: 'ACTIVITIES', labelZh: '活动' },
  { target: 'media', labelEn: 'MEDIA', labelZh: '万象' },
  { target: 'join', labelEn: 'JOIN US', labelZh: '加入我们' }
];
