import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppTheme, type AnchorId, type OfficialGroup } from '../types';
import type { ManagedImagesController } from '../hooks/useManagedImages';
import EventGallery from '../components/EventGallery';
import ManagedImageArchive from '../components/ManagedImageArchive';
import MobileActivities from '../components/mobile/MobileActivities';
import MobileFooter from '../components/mobile/MobileFooter';
import MobileGroups from '../components/mobile/MobileGroups';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileHero from '../components/mobile/MobileHero';
import MobileInfo from '../components/mobile/MobileInfo';
import MobileJoin from '../components/mobile/MobileJoin';
import MobileMedia from '../components/mobile/MobileMedia';
import WechatArchive from '../components/WechatArchive';
import { getMediaEntry, MEDIA_ENTRIES, type MediaContentId } from '../components/MediaHub';

interface MobileHomePageProps {
  selectedGroup: number;
  copiedGroupTitle: string | null;
  mainGroupNumber: string;
  joinGroupCopied: boolean;
  activeMediaEntry: MediaContentId | null;
  radioPlaying: boolean;
  imageManager: ManagedImagesController;
  onSelectGroup: (index: number) => void;
  onCopyGroup: (group: OfficialGroup) => void | Promise<void>;
  onCopyJoinGroupNumber: () => void | Promise<void>;
  onOpenMediaEntry: (entry: MediaContentId) => void;
  onCloseMediaEntry: () => void;
  onToggleRadio: () => void | Promise<void>;
}

const MobileHomePage: React.FC<MobileHomePageProps> = ({
  selectedGroup,
  copiedGroupTitle,
  mainGroupNumber,
  joinGroupCopied,
  activeMediaEntry,
  radioPlaying,
  imageManager,
  onSelectGroup,
  onCopyGroup,
  onCopyJoinGroupNumber,
  onOpenMediaEntry,
  onCloseMediaEntry,
  onToggleRadio
}) => {
  const [activeSection, setActiveSection] = useState<AnchorId>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollTargetRef = useRef<AnchorId | null>(null);
  const activeMedia = activeMediaEntry ? getMediaEntry(activeMediaEntry) : null;

  const scrollToSection = (target: AnchorId, behavior: ScrollBehavior = 'smooth') => {
    const scroller = scrollerRef.current;
    const section = scroller?.querySelector<HTMLElement>(`#${target}`);
    if (!scroller || !section) return;

    setActiveSection(target);
    section.scrollIntoView({ behavior, block: 'start' });
  };

  const navigateToSection = (target: AnchorId) => {
    setMenuOpen(false);

    if (activeMediaEntry) {
      pendingScrollTargetRef.current = target;
      onCloseMediaEntry();
      setActiveSection(target);
      return;
    }

    scrollToSection(target);
  };

  const closeMediaDetail = () => {
    pendingScrollTargetRef.current = 'media';
    onCloseMediaEntry();
  };

  useEffect(() => {
    if (activeMediaEntry) return;
    if (!pendingScrollTargetRef.current) return;

    const target = pendingScrollTargetRef.current;
    pendingScrollTargetRef.current = null;
    window.requestAnimationFrame(() => scrollToSection(target, 'auto'));
  }, [activeMediaEntry]);

  useEffect(() => {
    if (activeMediaEntry) return;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const sections = Array.from(scroller.querySelectorAll<HTMLElement>('[data-mobile-section]'));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const section = visibleEntry?.target.getAttribute('data-mobile-section') as AnchorId | null;
        if (section) setActiveSection(section);
      },
      {
        root: scroller,
        rootMargin: '-38% 0px -52% 0px',
        threshold: [0.08, 0.22, 0.42, 0.68]
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [activeMediaEntry]);

  if (activeMediaEntry && activeMedia) {
    return (
      <div className="mobile-site h-[100dvh] overflow-hidden bg-[#080808] text-white selection:bg-[#c8322a] selection:text-white">
        <MobileHeader
          activeSection="media"
          menuOpen={menuOpen}
          radioPlaying={radioPlaying}
          onNavigate={navigateToSection}
          onMenuToggle={() => setMenuOpen((current) => !current)}
          onMenuClose={() => setMenuOpen(false)}
          onToggleRadio={onToggleRadio}
          onOpenMediaEntry={onOpenMediaEntry}
        />

        <main className="h-full overflow-y-auto overflow-x-hidden px-5 pb-12 pt-[86px]">
          <button
            type="button"
            onClick={closeMediaDetail}
            className="mb-5 flex min-h-[46px] items-center gap-2 border border-white/16 bg-black/50 px-4 text-sm font-black tracking-[0.14em] text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回万象
          </button>

          <div className="mb-6 border-b border-white/12 pb-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.34em] text-[#c8322a]">{activeMedia.label}</p>
            <h1 className="mt-2 text-4xl font-black leading-none text-white">{activeMedia.title}</h1>
            <p className="mt-3 text-sm font-bold leading-relaxed text-white/56">{activeMedia.description}</p>
            <div className="mobile-tab-scroll -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {MEDIA_ENTRIES.map((entry) => {
                const EntryIcon = entry.icon;
                const active = entry.id === activeMediaEntry;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onOpenMediaEntry(entry.id)}
                    className={`flex min-h-[42px] shrink-0 items-center gap-2 border px-3 text-xs font-black ${
                      active ? 'border-[#c8322a] bg-[#c8322a] text-white' : 'border-white/14 bg-white/[0.04] text-white/62'
                    }`}
                  >
                    <EntryIcon className="h-4 w-4" />
                    {entry.title}
                  </button>
                );
              })}
            </div>
          </div>

          {activeMediaEntry === 'videos' && <EventGallery currentTheme={AppTheme.DEFAULT} isEditMode={false} />}
          {activeMediaEntry === 'wechat' && <WechatArchive isEditMode={false} />}
          {activeMediaEntry === 'gallery' && (
            <ManagedImageArchive category="gallery" activeMedia={activeMedia} isEditMode={false} imageManager={imageManager} />
          )}
          {activeMediaEntry === 'vocaloid' && (
            <ManagedImageArchive category="album" activeMedia={activeMedia} isEditMode={false} imageManager={imageManager} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="mobile-site h-[100dvh] overflow-hidden bg-[#080808] text-white selection:bg-[#c8322a] selection:text-white">
      <MobileHeader
        activeSection={activeSection}
        menuOpen={menuOpen}
        radioPlaying={radioPlaying}
        onNavigate={navigateToSection}
        onMenuToggle={() => setMenuOpen((current) => !current)}
        onMenuClose={() => setMenuOpen(false)}
        onToggleRadio={onToggleRadio}
        onOpenMediaEntry={onOpenMediaEntry}
      />

      <main ref={scrollerRef} className="h-full overflow-y-auto overflow-x-hidden scroll-smooth">
        <MobileHero onNavigate={navigateToSection} />
        <MobileInfo mainGroupNumber={mainGroupNumber} onNavigate={navigateToSection} />
        <MobileGroups
          selectedGroup={selectedGroup}
          copiedGroupTitle={copiedGroupTitle}
          onSelectGroup={onSelectGroup}
          onCopyGroup={onCopyGroup}
        />
        <MobileActivities />
        <MobileMedia onOpenEntry={onOpenMediaEntry} />
        <MobileJoin
          mainGroupNumber={mainGroupNumber}
          joinGroupCopied={joinGroupCopied}
          onCopyJoinGroupNumber={onCopyJoinGroupNumber}
        />
        <MobileFooter mainGroupNumber={mainGroupNumber} />
      </main>
    </div>
  );
};

export default MobileHomePage;
