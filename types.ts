import type { ElementType } from 'react';

export enum AppTheme {
  DEFAULT = 'default',
  WINTER = 'winter',
  GMA = 'gma',
  ANNIVERSARY = 'anniversary'
}

export type AnchorId = 'home' | 'about' | 'groups' | 'activities' | 'media' | 'join';

export interface NavItem {
  label: string;
  labelEn: string;
  target: AnchorId;
  icon: ElementType;
}

export interface OfficialGroup {
  title: string;
  label: string;
  qq: string;
  description: string;
  newcomerNote: string;
  activities: string[];
  image: string;
  icon: ElementType;
}

export interface ActivityItem {
  title: string;
  kicker: string;
  description: string;
  details: string[];
  icon: ElementType;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  tag?: string;
  link?: string;
  coverUrl?: string;
}

export type VideoCategory = 'winter' | 'anniversary' | 'gma' | 'daily';

export interface VideoContent {
  id: string;
  title: string;
  url: string; // URL.createObjectURL or external link
  type: 'bilibili';
  thumbnail?: string;
  category: VideoCategory;
}

export type ManagedImageCategory = 'gallery' | 'album';

export interface ManagedImageItem {
  id: string;
  title: string;
  imageUrl: string;
  category: ManagedImageCategory;
}

export interface SiteSettings {
  mainGroupNumber: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}
