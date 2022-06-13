import { Icon } from '@sajari-ui/core';
import { ResultItem } from '.';

import { formatNumber } from 'utils/number';
import Rating from '../Rating';
import Image from './Image';

const GridItem = ({ data }: { data: ResultItem }) => (
  <article className="mb-8 text-center" key={data.id}>
    <a href={data.url} target="_blank" rel="noreferrer noopener" className="relative block h-0 mb-3 pb-full">
      <Image src={data.image} alt={data.title} className="absolute" />
    </a>

    <h1 className="mt-4 font-medium text-gray-900">
      <a href={data.url} target="_blank" rel="noreferrer noopener" className="focus:shadow-outline">
        {data.title}
      </a>
    </h1>

    {data.rating && (
      <div className="flex items-center justify-center mt-2">
        <Rating id={data.id} value={Number(data.rating)} />
      </div>
    )}

    {data.price && <h2 className="mt-2 text-gray-500">{formatNumber(Number(data.price), 'USD', true)}</h2>}

    {data.freeShipping === 'true' && (
      <span className="inline-flex items-center ml-4 text-xs font-medium text-green-500">
        <Icon name="check" margin="mr-2" />
        Free shipping
      </span>
    )}
  </article>
);

export default GridItem;
