/* eslint-disable react/prop-types */
import { formatNumber } from '../../utils/number';
import { IconCheck } from '../Icons';
import Rating from '../Rating';
import Image from './Image';

const GridItem = ({ data }) => (
  <article className="mb-8 text-center" key={data.id}>
    <a href={data.url} target="_blank" rel="noreferrer noopener" className="block mb-3">
      <Image src={data.image} alt={data.title} />
    </a>

    <h1 className="mt-4 font-medium text-gray-900">
      <a href={data.url} target="_blank" rel="noreferrer noopener" className="focus:shadow-outline">
        {data.title}
      </a>
    </h1>

    {data.rating && (
      <p className="flex items-center justify-center mt-2">
        <Rating value={Number(data.rating)} />
      </p>
    )}

    {data.price && <h2 className="mt-2 text-gray-500">{formatNumber(data.price, 'USD', true)}</h2>}

    {data.freeShipping === 'true' && (
      <span className="inline-flex items-center ml-4 text-xs font-medium text-green-500">
        <IconCheck className="mr-2 fill-current" />
        Free shipping
      </span>
    )}
  </article>
);

export default GridItem;
