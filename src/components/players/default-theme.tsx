'use client';

import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaPlayButton,
  MediaMuteButton,
  MediaPipButton,
  MediaFullscreenButton,
} from 'media-chrome/react';

import {
  MediaSettingsMenuButton,
  MediaSettingsMenu,
  MediaSettingsMenuItem,
  MediaPlaybackRateMenu,
  MediaRenditionMenu,
  MediaCaptionsMenu,
  MediaAudioTrackMenu,
} from 'media-chrome/react/menu';

type DefaultThemeProps = {
  style?: React.CSSProperties;
  children: React.ReactNode;
  [k: string]: any;
};

function DefaultTheme({ children, ...props }: DefaultThemeProps) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: /* css */ `
            media-settings-menu-item[aria-haspopup]:is(
              :not([submenusize]),
              [submenusize="0"],
              [submenusize="1"]
            ) {
              display: none;
            }
          `,
        }}
      />
      <MediaController {...props}>
        {children}
        <MediaControlBar>
          <MediaPlayButton />
          <MediaMuteButton />
          <MediaTimeDisplay />
          <MediaTimeRange />
          <MediaSettingsMenuButton />
          <MediaSettingsMenu hidden anchor="auto">
            <MediaSettingsMenuItem>
              Speed
              <MediaPlaybackRateMenu slot="submenu" hidden>
                <div slot="title">Speed</div>
              </MediaPlaybackRateMenu>
            </MediaSettingsMenuItem>
            <MediaSettingsMenuItem>
              Quality
              <MediaRenditionMenu slot="submenu" hidden>
                <div slot="title">Quality</div>
              </MediaRenditionMenu>
            </MediaSettingsMenuItem>
            <MediaSettingsMenuItem>
              Captions
              <MediaCaptionsMenu slot="submenu" hidden>
                <div slot="title">Captions</div>
              </MediaCaptionsMenu>
            </MediaSettingsMenuItem>
            <MediaSettingsMenuItem>
              Audio
              <MediaAudioTrackMenu slot="submenu" hidden>
                <div slot="title">Audio</div>
              </MediaAudioTrackMenu>
            </MediaSettingsMenuItem>
          </MediaSettingsMenu>
          <MediaPipButton />
          <MediaFullscreenButton />
        </MediaControlBar>
      </MediaController>
    </>
  );
}

export default DefaultTheme;
