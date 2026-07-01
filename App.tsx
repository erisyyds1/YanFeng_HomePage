import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { WECHAT_ARTICLES } from './constants';
import { SECONDARY_BG_IMAGE, SCREEN_IDS } from './data/siteContent';
import type { AnchorId, OfficialGroup } from './types';
import { AppTheme } from './types';
import { copyText } from './utils/clipboard';
import { useEditMode } from './hooks/useEditMode';
import { useManagedImages } from './hooks/useManagedImages';
import { useSiteSettings } from './hooks/useSiteSettings';

import AdminOverlays from './components/AdminOverlays';
import EventGallery from './components/EventGallery';
import ManagedImageArchive from './components/ManagedImageArchive';
import MediaHub, { getMediaEntry, MEDIA_ENTRIES, type MediaContentId } from './components/MediaHub';
import ScrollGuide from './components/ScrollGuide';
import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';
import WechatArchive from './components/WechatArchive';
import ActivitiesPage from './pages/ActivitiesPage';
import GroupsPage from './pages/GroupsPage';
import HomePage from './pages/HomePage';
import InfoPage from './pages/InfoPage';
import JoinPage from './pages/JoinPage';

const SITE_FOOTER_HEIGHT = 'clamp(300px, 38dvh, 420px)';
const PAGE_TRANSITION_MS = 1180;
const PAGE_TRANSITION_EASE = 'cubic-bezier(0.68, 0.02, 0.88, 0.58)';

const App: React.FC = () => {
  const editMode = useEditMode();
  const siteSettings = useSiteSettings();
  const imageManager = useManagedImages();

  const [selectedGroup, setSelectedGroup] = useState(0);
  const [copiedGroupTitle, setCopiedGroupTitle] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<AnchorId>('home');
  const [activeMediaEntry, setActiveMediaEntry] = useState<MediaContentId | null>(null);
  const [outgoingScreen, setOutgoingScreen] = useState<AnchorId | null>(null);
  const [transitionDirection, setTransitionDirection] = useState(0);
  const [footerVisible, setFooterVisible] = useState(false);

  const activeScreenRef = useRef<AnchorId>('home');
  const activeMediaEntryRef = useRef<MediaContentId | null>(null);
  const footerVisibleRef = useRef(false);
  const mediaPageRef = useRef<HTMLElement | null>(null);
  const radioAudioRef = useRef<HTMLAudioElement | null>(null);
  const radioAutoPlayCleanupRef = useRef<(() => void) | null>(null);
  const radioHasStartedRef = useRef(false);
  const radioPlayAttemptRef = useRef(false);
  const outgoingTimerRef = useRef<number | null>(null);
  const transitionLockRef = useRef(false);
  const wheelLockRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const { isEditMode } = editMode;
  const { mainGroupNumber, joinGroupCopied } = siteSettings;
  const activeMedia = activeMediaEntry ? getMediaEntry(activeMediaEntry) : null;
  const activeScreenIndex = SCREEN_IDS.indexOf(activeScreen);

  useEffect(() => {
    document.body.setAttribute('data-theme', AppTheme.DEFAULT);
  }, []);

  useEffect(() => {
    activeScreenRef.current = activeScreen;
  }, [activeScreen]);

  useEffect(() => {
    footerVisibleRef.current = footerVisible;
  }, [footerVisible]);

  useEffect(() => {
    activeMediaEntryRef.current = activeMediaEntry;
    if (activeMediaEntry && mediaPageRef.current) {
      mediaPageRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeMediaEntry]);

  useEffect(() => {
    return () => {
      if (outgoingTimerRef.current) window.clearTimeout(outgoingTimerRef.current);
    };
  }, []);

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const removeRadioAutoPlayListeners = () => {
    if (!radioAutoPlayCleanupRef.current) return;
    radioAutoPlayCleanupRef.current();
    radioAutoPlayCleanupRef.current = null;
  };

  const playRadio = async () => {
    const audio = radioAudioRef.current;
    if (!audio || radioPlayAttemptRef.current) return false;

    radioPlayAttemptRef.current = true;
    audio.volume = 0.35;
    audio.loop = true;

    try {
      await audio.play();
      radioHasStartedRef.current = true;
      removeRadioAutoPlayListeners();
      return true;
    } catch (error) {
      console.warn('YANFENG RADIO playback was blocked:', error);
      return false;
    } finally {
      radioPlayAttemptRef.current = false;
    }
  };

  useEffect(() => {
    const audio = radioAudioRef.current;
    if (!audio) return;

    audio.volume = 0.35;
    audio.loop = true;

    const handleFirstClick = () => {
      if (radioHasStartedRef.current) {
        removeRadioAutoPlayListeners();
        return;
      }
      void playRadio();
    };
    const clickAutoPlayOptions: AddEventListenerOptions = { capture: true };

    const cleanup = () => {
      window.removeEventListener('click', handleFirstClick, clickAutoPlayOptions);
    };

    radioAutoPlayCleanupRef.current = cleanup;
    window.addEventListener('click', handleFirstClick, clickAutoPlayOptions);

    return cleanup;
  }, []);

  const goToScreen = (target: AnchorId) => {
    const current = activeScreenRef.current;
    if (current === target) return;
    if (transitionLockRef.current) return;

    const currentIndex = SCREEN_IDS.indexOf(current);
    const targetIndex = SCREEN_IDS.indexOf(target);

    transitionLockRef.current = true;
    setFooterVisible(false);
    setOutgoingScreen(current);
    setTransitionDirection(targetIndex > currentIndex ? 1 : -1);
    setActiveScreen(target);

    if (outgoingTimerRef.current) window.clearTimeout(outgoingTimerRef.current);
    outgoingTimerRef.current = window.setTimeout(() => {
      setOutgoingScreen(null);
      transitionLockRef.current = false;
      outgoingTimerRef.current = null;
    }, prefersReducedMotion() ? 120 : PAGE_TRANSITION_MS + 80);
  };

  const showHomeSection = (target: AnchorId = 'home') => {
    setActiveMediaEntry(null);
    goToScreen(target);
  };

  const copyGroupNumber = async (group: OfficialGroup) => {
    const groupNumber = group.qq.trim();
    if (!groupNumber || groupNumber === '待补充') return;

    try {
      await copyText(groupNumber);
      setCopiedGroupTitle(group.title);
      window.setTimeout(() => {
        setCopiedGroupTitle((current) => (current === group.title ? null : current));
      }, 1600);
    } catch (error) {
      console.error('Failed to copy group number:', error);
    }
  };

  const openMediaEntry = (entry: MediaContentId) => {
    setActiveMediaEntry(entry);
  };

  const closeMediaEntry = () => {
    setActiveMediaEntry(null);
    if (activeScreenRef.current !== 'media') {
      goToScreen('media');
    }
  };

  const handlePagerWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (activeMediaEntryRef.current) return;

    const wheelIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(wheelIntent) < 24 || wheelLockRef.current || transitionLockRef.current) {
      if (wheelLockRef.current || transitionLockRef.current) event.preventDefault();
      return;
    }

    const currentScreen = activeScreenRef.current;
    const currentIndex = SCREEN_IDS.indexOf(currentScreen);
    const direction = wheelIntent > 0 ? 1 : -1;

    if (currentScreen === 'join' && direction > 0) {
      event.preventDefault();
      if (!footerVisibleRef.current) {
        setFooterVisible(true);
      }
      wheelLockRef.current = true;
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, prefersReducedMotion() ? 120 : 620);
      return;
    }

    if (footerVisibleRef.current) {
      event.preventDefault();
      if (direction < 0) {
        setFooterVisible(false);
      }
      wheelLockRef.current = true;
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, prefersReducedMotion() ? 120 : 620);
      return;
    }

    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), SCREEN_IDS.length - 1);
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    wheelLockRef.current = true;
    goToScreen(SCREEN_IDS[nextIndex]);
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, prefersReducedMotion() ? 120 : PAGE_TRANSITION_MS);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeMediaEntryRef.current) {
        if (event.key === 'Escape') closeMediaEntry();
        return;
      }

      const currentScreen = activeScreenRef.current;
      const wantsNext = event.key === 'ArrowRight' || event.key === 'PageDown';
      const wantsPrevious = event.key === 'ArrowLeft' || event.key === 'PageUp';

      if (footerVisibleRef.current && wantsPrevious) {
        event.preventDefault();
        setFooterVisible(false);
        return;
      }

      if (currentScreen === 'join' && wantsNext) {
        event.preventDefault();
        setFooterVisible(true);
        return;
      }

      if (footerVisibleRef.current && wantsNext) {
        event.preventDefault();
        return;
      }

      const currentIndex = SCREEN_IDS.indexOf(currentScreen);
      const nextIndex = wantsNext
        ? Math.min(currentIndex + 1, SCREEN_IDS.length - 1)
        : wantsPrevious
          ? Math.max(currentIndex - 1, 0)
          : currentIndex;

      if (nextIndex !== currentIndex) {
        event.preventDefault();
        goToScreen(SCREEN_IDS[nextIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (activeMediaEntryRef.current) return;
    if (!touchStartRef.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    const currentIndex = SCREEN_IDS.indexOf(activeScreenRef.current);
    const nextIndex = deltaX < 0 ? Math.min(currentIndex + 1, SCREEN_IDS.length - 1) : Math.max(currentIndex - 1, 0);
    if (nextIndex !== currentIndex) goToScreen(SCREEN_IDS[nextIndex]);
  };

  const getPanelStyle = (index: number): React.CSSProperties => {
    const screen = SCREEN_IDS[index];
    const isActive = activeScreen === screen;
    const isOutgoing = outgoingScreen === screen;
    const concealedFromLeft = 'polygon(-12% 0, -12% 0, 4% 100%, 4% 100%)';
    const concealedFromRight = 'polygon(96% 0, 112% 0, 112% 100%, 96% 100%)';
    const revealed = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
    const maskClip = isActive || isOutgoing ? revealed : index < activeScreenIndex ? concealedFromLeft : concealedFromRight;
    const isVisiblePanel = isActive || isOutgoing;
    const coverShadow =
      isActive && outgoingScreen
        ? transitionDirection >= 0
          ? '-34px 0 90px rgb(0 0 0 / 0.56)'
          : '34px 0 90px rgb(0 0 0 / 0.56)'
        : 'none';

    return {
      zIndex: isActive ? 30 : isOutgoing ? 20 : 0,
      clipPath: maskClip,
      WebkitClipPath: maskClip,
      opacity: 1,
      filter: isOutgoing ? 'brightness(0.45) saturate(0.78)' : 'none',
      pointerEvents: isActive ? 'auto' : 'none',
      boxShadow: coverShadow,
      transition: prefersReducedMotion() || !isVisiblePanel
        ? 'none'
        : [
            `clip-path ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASE}`,
            `-webkit-clip-path ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASE}`,
            `filter ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASE}`,
            `box-shadow ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASE}`
          ].join(', ')
    };
  };

  const getSecondaryPanelStyle = (index: number): React.CSSProperties => ({
    ...getPanelStyle(index),
    backgroundImage: `linear-gradient(180deg, rgb(8 8 8 / 0.22), rgb(8 8 8 / 0.72)), url(${SECONDARY_BG_IMAGE})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  });

  const getPanelState = (screen: AnchorId) => {
    if (activeScreen === screen) return 'active';
    if (outgoingScreen === screen) return 'outgoing';
    return 'idle';
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#080808] font-sans text-[#f6f0dc] selection:bg-[#c8322a] selection:text-white">
      <div className="checker-bg pointer-events-none fixed inset-0 opacity-[0.08]"></div>

      <AdminOverlays
        isEditMode={isEditMode}
        onExitEditMode={editMode.exitEditMode}
        adminAccessOpen={editMode.adminAccessOpen}
        adminAccessValue={editMode.adminAccessValue}
        onAdminAccessValueChange={editMode.setAdminAccessValue}
        onCloseAdminAccess={editMode.closeAdminAccess}
        onSubmitAdminAccess={editMode.submitAdminAccess}
        groupEditorOpen={siteSettings.groupEditorOpen}
        groupEditorValue={siteSettings.groupEditorValue}
        groupEditorError={siteSettings.groupEditorError}
        groupEditorNotice={siteSettings.groupEditorNotice}
        onGroupEditorValueChange={siteSettings.setGroupEditorValue}
        onClearGroupEditorFeedback={() => {
          siteSettings.setGroupEditorError('');
          siteSettings.setGroupEditorNotice('');
        }}
        onCloseGroupEditor={() => siteSettings.setGroupEditorOpen(false)}
        onSubmitGroupNumber={siteSettings.submitGroupNumber}
        imageDeleteTarget={imageManager.imageDeleteTarget}
        onCancelDeleteImage={() => imageManager.setImageDeleteTarget(null)}
        onConfirmDeleteImage={() => void imageManager.confirmDeleteManagedImage()}
      />

      <SiteHeader activeScreen={activeScreen} onNavigate={showHomeSection} />

      {activeMedia ? (
        <main ref={mediaPageRef} className="h-[100dvh] overflow-y-auto px-5 pb-20 pt-28 md:px-10">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-8 flex flex-col gap-5 border-b border-white/15 pb-6">
              <button
                type="button"
                onClick={closeMediaEntry}
                className="flex w-fit items-center gap-2 border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:border-[#c8322a] hover:bg-[#c8322a]"
              >
                <ArrowLeft className="h-4 w-4" />
                返回檐枫万象
              </button>

              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">{activeMedia.label}</p>
                  <h1 className="mt-2 text-5xl font-black tracking-[-0.05em] text-white md:text-7xl">{activeMedia.title}</h1>
                  <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-white/60">{activeMedia.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {MEDIA_ENTRIES.map((entry) => {
                    const EntryIcon = entry.icon;
                    const active = entry.id === activeMediaEntry;

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => openMediaEntry(entry.id)}
                        className={`flex items-center gap-2 border px-3 py-2 text-xs font-black tracking-[0.12em] transition ${
                          active ? 'border-[#c8322a] bg-[#c8322a] text-white' : 'border-white/15 bg-black/35 text-white/65 hover:border-white/35 hover:text-white'
                        }`}
                      >
                        <EntryIcon className="h-3.5 w-3.5" />
                        {entry.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {activeMediaEntry === 'videos' && <EventGallery currentTheme={AppTheme.DEFAULT} isEditMode={isEditMode} />}
            {activeMediaEntry === 'wechat' && <WechatArchive articles={WECHAT_ARTICLES} />}
            {activeMediaEntry === 'gallery' && (
              <ManagedImageArchive category="gallery" activeMedia={activeMedia} isEditMode={isEditMode} imageManager={imageManager} />
            )}
            {activeMediaEntry === 'vocaloid' && (
              <ManagedImageArchive category="album" activeMedia={activeMedia} isEditMode={isEditMode} imageManager={imageManager} />
            )}
          </div>
        </main>
      ) : (
        <main
          onWheel={handlePagerWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative h-[100dvh] overflow-hidden"
        >
          <div
            className="relative z-10 h-full w-full overflow-hidden bg-[#080808]"
            style={{
              transform: footerVisible ? `translate3d(0, calc(-1 * ${SITE_FOOTER_HEIGHT}), 0)` : 'translate3d(0, 0, 0)',
              transition: prefersReducedMotion() ? 'none' : 'transform 720ms cubic-bezier(0.55, 0, 0.18, 1)'
            }}
          >
            <section
              id="home"
              data-active={activeScreen === 'home'}
              data-state={getPanelState('home')}
              style={getPanelStyle(0)}
              className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden pt-28 lg:pt-20"
            >
              <HomePage onNavigate={showHomeSection} />
            </section>

            <section
              id="about"
              data-active={activeScreen === 'about'}
              data-state={getPanelState('about')}
              style={getSecondaryPanelStyle(1)}
              className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden border-y border-white/10 bg-[#090909] px-5 py-24 md:px-10"
            >
              <InfoPage onOpenGroups={() => showHomeSection('groups')} />
            </section>

            <section
              id="groups"
              data-active={activeScreen === 'groups'}
              data-state={getPanelState('groups')}
              style={getSecondaryPanelStyle(2)}
              className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden bg-[#080808] px-5 pb-10 pt-24 md:px-10"
            >
              <GroupsPage
                selectedGroup={selectedGroup}
                copiedGroupTitle={copiedGroupTitle}
                onSelectGroup={setSelectedGroup}
                onCopyGroup={copyGroupNumber}
              />
            </section>

            <section
              id="activities"
              data-active={activeScreen === 'activities'}
              data-state={getPanelState('activities')}
              style={getSecondaryPanelStyle(3)}
              className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden bg-[#101010] px-5 py-24 md:px-10"
            >
              <ActivitiesPage />
            </section>

            <section
              id="media"
              data-active={activeScreen === 'media'}
              data-state={getPanelState('media')}
              style={getSecondaryPanelStyle(4)}
              className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden bg-[#080808] pb-0 pt-24 md:pt-28"
            >
              <div className="h-full w-full">
                <MediaHub onOpenEntry={openMediaEntry} />
              </div>
            </section>

            <section
              id="join"
              data-active={activeScreen === 'join'}
              data-state={getPanelState('join')}
              style={getPanelStyle(5)}
              className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden bg-[#080808] text-white"
            >
              <JoinPage
                mainGroupNumber={mainGroupNumber}
                joinGroupCopied={joinGroupCopied}
                isEditMode={isEditMode}
                onCopyJoinGroupNumber={siteSettings.copyJoinGroupNumber}
                onOpenGroupEditor={siteSettings.openGroupEditor}
              />
            </section>

            {!footerVisible && <ScrollGuide currentIndex={activeScreenIndex} total={SCREEN_IDS.length} />}
          </div>

          <SiteFooter
            height={SITE_FOOTER_HEIGHT}
            mainGroupNumber={mainGroupNumber}
            onSunflowerDoubleClick={editMode.openAdminAccess}
            onBackToPage={() => setFooterVisible(false)}
          />
        </main>
      )}

      <audio ref={radioAudioRef} src="/music/bgm.mp3" preload="auto" loop />
    </div>
  );
};

export default App;
