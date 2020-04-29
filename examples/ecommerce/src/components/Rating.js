/* eslint-disable react/prop-types */
import { Fragment } from 'preact';

import { IconStar } from './Icons';

const Rating = ({ value, max = 6 }) => {
  const remainder = max - value;

  return (
    <Fragment>
      {Array.from(Array(value)).map((k, i) => (
        <IconStar className={`${i > 0 ? 'ml-1' : ''} text-orange-400 fill-current`} />
      ))}
      {Array.from(Array(remainder)).map((k, i) => (
        <IconStar className={`${value > 0 || i > 0 ? 'ml-1' : ''} text-gray-300 fill-current`} />
      ))}
      <span className="sr-only">{`${value} stars`}</span>
    </Fragment>
  );
};

export default Rating;
