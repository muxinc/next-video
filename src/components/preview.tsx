import React from 'react';

const Preview = ({ light, onClickPreview }: any) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClickPreview?.(e);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClickPreview?.(e);
  };

  const isElement = React.isValidElement(light);

  return (
    <>
      <style>{
        /* css */ `
        .next-video-preview-flex-center {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .next-video-preview {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          cursor: pointer;
          /* background-image must be set dynamically (light URL) */
          background-image: url('${isElement ? '' : light}');
          ${isElement ? '' : 'aspect-ratio: 16/9;'}
        }

        .next-video-preview-shadow {
          background: radial-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0) 60%);
          border-radius: 64px;
          width: 64px;
          height: 64px;
          position: absolute;
        }

        .next-video-preview-play-icon {
          border-style: solid;
          border-width: 16px 0 16px 26px;
          border-color: transparent transparent transparent white;
          margin-left: 7px;
        }
        `
      }
      </style>
      <div
        className="next-video-preview next-video-preview-flex-center"
        onClick={handleClick}
        onKeyDown={handleKeyPress}
      >
        {isElement ? light : null}
        <div className="next-video-preview-shadow next-video-preview-flex-center">
          <div className="next-video-preview-play-icon" />
        </div>
      </div>
    </>
  );
};

export default Preview;
