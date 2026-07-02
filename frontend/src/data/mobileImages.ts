export const MOBILE_LOGO_IMAGE = '/image/mobile-yanfeng-logo-wordmark.webp';
export const MOBILE_HERO_IMAGE = '/image/mobile-yanfeng-hero.webp';
export const MOBILE_JOIN_IMAGE = '/image/mobile-join-2025-anniversary.webp';

export const MOBILE_ACTIVITY_IMAGES = [
  '/image/mobile-activity-baifest.webp',
  '/image/mobile-activity-winter.webp',
  '/image/mobile-activity-anniversary.webp'
];

const MOBILE_GROUP_IMAGES: Record<string, string> = {
  '/image/group-anime.jpg': '/image/mobile-group-anime.webp',
  '/image/group-dance.jpg': '/image/mobile-group-dance.webp',
  '/image/group-create.jpg': '/image/mobile-group-create.webp',
  '/image/group-vocal.jpg': '/image/mobile-group-vocal.webp',
  '/image/group-stage.jpg': '/image/mobile-group-stage.webp',
  '/image/group-delta.jpeg': '/image/mobile-group-delta.webp',
  '/image/group-wota.jpeg': '/image/mobile-group-wota.webp',
  '/image/group-band.jpg': '/image/mobile-group-band.webp',
  '/image/group-vocaloid.webp': '/image/mobile-group-vocaloid.webp',
  '/image/group-support.jpeg': '/image/mobile-group-support.webp'
};

export const getMobileGroupImage = (source: string) => MOBILE_GROUP_IMAGES[source] || source;
