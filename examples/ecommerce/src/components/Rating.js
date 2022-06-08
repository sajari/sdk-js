/* eslint-disable react/prop-types */
import { Box, Icon } from '@sajari-ui/core';

const Rating = ({ value, max = 6 }) => {
  const remainder = max - value;

  return (
    <Box display="inline-flex" alignItems="items-center" space="space-x-1">
      {Array.from(Array(value)).map((k, i) => (
        <Icon name="small-star" textColor="text-orange-400" />
      ))}
      {Array.from(Array(remainder)).map((k, i) => (
        <Icon name="small-star" textColor="text-gray-300" />
      ))}
      <span className="sr-only">{`${value} stars`}</span>
    </Box>
  );
};

export default Rating;
