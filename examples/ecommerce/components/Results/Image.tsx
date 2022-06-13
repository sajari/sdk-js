import { Icon } from '@sajari-ui/core';
import classnames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';

import is from 'utils/is';

interface Props extends React.HTMLProps<HTMLImageElement> {}

interface ImageState {
  naturalHeight: number;
  naturalWidth: number;
  loaded: boolean;
  failed: boolean;
}

const Image = ({ className, src, alt = '' }: Props) => {
  const [{ failed, loaded, naturalHeight, naturalWidth }, _setState] = useState<ImageState>({
    naturalWidth: 0,
    naturalHeight: 0,
    loaded: false,
    failed: false,
  });
  const element = useRef<HTMLMediaElement & HTMLImageElement>(null);

  const setState = (s: Partial<ImageState>) => {
    _setState((o) => ({ ...o, ...s }));
  };

  const isLoaded = useCallback(() => {
    if (!element.current) {
      return false;
    }

    if (is.image(element.current)) {
      const { complete, naturalHeight, naturalWidth } = element.current;

      if (naturalHeight > 0 && naturalWidth > 0) {
        return true;
      }
      if (complete) {
        return false;
      }
    }

    if (is.media(element.current)) {
      return element.current.readyState > 0;
    }

    return false;
  }, [element.current]);

  const onLoad = useCallback(() => {
    // Prevent re-render if already marked loaded
    if (loaded) {
      return;
    }

    if (is.image(element.current)) {
      // Check the image is actually loaded.
      // Firefox triggers onLoad on onError too
      if (!isLoaded()) {
        return;
      }

      const { naturalWidth, naturalHeight } = element.current;

      setState({
        naturalWidth,
        naturalHeight,
      });
    }

    setState({
      loaded: true,
    });
  }, [loaded, isLoaded, element.current]);

  const onError = useCallback(() => {
    setState({
      failed: true,
      loaded: true,
    });
  }, []);

  const renderImage = useCallback(() => {
    if (failed || is.empty(src)) {
      return <Icon name="image" textColor="text-gray-300" />;
    }

    return (
      <img
        src={src}
        alt={alt}
        height={naturalHeight}
        width={naturalWidth}
        onLoad={onLoad}
        onError={onError}
        ref={element}
        loading="lazy"
        className={classnames('rounded', 'transition', 'duration-200', 'object-contain', 'max-h-full', {
          'opacity-0': !loaded,
        })}
      />
    );
  }, [naturalHeight, naturalWidth, src, alt, onLoad, onError, element.current, loaded, failed]);

  useEffect(() => {
    let complete = false;
    if (is.image(element.current)) {
      complete = element.current.complete;
    }

    if (isLoaded()) {
      // Delay to prevent infinite loop (!!)
      setTimeout(() => onLoad(), 100);
    } else if (complete) {
      setTimeout(() => onError(), 100);
    }
  }, [element.current]);

  return (
    <span
      className={classnames(
        'flex',
        'items-center',
        'justify-center',
        'w-full',
        'h-full',
        { 'bg-gray-100': !loaded },
        { rounded: !loaded },
        className,
      )}
    >
      {renderImage()}
    </span>
  );
};

export default Image;
