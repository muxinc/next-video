import React from 'react';

function Video(props) {
  return (
    <div style={{
      aspectRatio: '16/9',
      background: 'black',
      width: '100%',
    }}>
      {props.src}
    </div>
  );
}

export default Video;
