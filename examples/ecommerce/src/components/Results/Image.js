/* eslint-disable react/prop-types */
import classnames from 'classnames';
import { Component } from 'preact';

import is from '../../utils/is';
import { IconLargeCamera } from '../Icons';

class Image extends Component {
  mounted = false;

  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      failed: false,
    };
  }

  componentWillMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  get loaded() {
    if (!this.element) {
      return false;
    }

    if (is.image(this.element)) {
      const { complete, naturalHeight, naturalWidth } = this.element;

      if (naturalHeight > 0 && naturalWidth > 0) {
        return true;
      }
      if (complete) {
        return false;
      }
    }

    if (is.media(this.element)) {
      return this.element.readyState > 0;
    }

    return false;
  }

  onError = () => {
    if (!this.mounted) {
      return;
    }

    this.setState({
      failed: true,
      loaded: true,
    });
  };

  onLoad = (event) => {
    if (!this.mounted) {
      return;
    }

    const { loaded } = this.state;

    // Prevent re-render if already marked loaded
    if (loaded) {
      return;
    }

    if (is.image(this.element)) {
      // Check the image is actually loaded.
      // Firefox triggers onLoad on onError too
      if (!this.loaded) {
        return;
      }

      const { naturalWidth, naturalHeight } = this.element;

      this.setState({
        naturalWidth,
        naturalHeight,
      });
    }

    this.setState({
      loaded: true,
    });

    const { onLoad, id } = this.props;

    if (is.function(onLoad)) {
      onLoad(id, is.event(event) ? event.target : event);
    }
  };

  setRef = (element) => {
    if (!element) {
      return;
    }

    this.element = element;

    const { complete } = this.element;

    if (this.loaded) {
      // Delay to prevent infinite loop (!!)
      setTimeout(() => this.onLoad(this.element), 100);
    } else if (complete) {
      setTimeout(() => this.onError(this.element), 100);
    }
  };

  renderImage = () => {
    const { src, alt = '' } = this.props;
    const { loaded, failed, naturalHeight, naturalWidth } = this.state;

    if (failed || is.empty(src)) {
      return <IconLargeCamera className="text-gray-300 fill-current" />;
    }

    return (
      <img
        src={src}
        alt={alt}
        height={naturalHeight}
        width={naturalWidth}
        onLoad={this.onLoad}
        onError={this.onError}
        ref={this.setRef}
        loading="lazy"
        className={classnames('rounded', 'transition', 'duration-200', 'object-contain', 'max-h-full', {
          'opacity-0': !loaded,
        })}
      />
    );
  };

  render() {
    const { className } = this.props;
    const { loaded } = this.state;

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
        {this.renderImage()}
      </span>
    );
  }
}

export default Image;
