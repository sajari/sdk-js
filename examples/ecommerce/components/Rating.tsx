import { Icon } from '@sajari-ui/core';

interface Props {
  id: string;
  value: number;
  max?: number;
}

const Rating = ({ value, max = 6, id }: Props) => {
  const remainder = max - value;

  return (
    <div className="inline-flex items-center space-x-1">
      {Array.from(Array(value)).map((_, i) => (
        <Icon key={`rating-active-${i}-${id}`} name="small-star" textColor="text-orange-400" />
      ))}
      {Array.from(Array(remainder)).map((_, i) => (
        <Icon key={`rating-${i}-{id}`} name="small-star" textColor="text-gray-300" />
      ))}
      <span className="sr-only">{`${value} stars`}</span>
    </div>
  );
};

export default Rating;
