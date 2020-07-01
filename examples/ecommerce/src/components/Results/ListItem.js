/* eslint-disable react/prop-types */
import is from '../../utils/is';
import { formatNumber } from '../../utils/number';
import { IconCheck } from '../Icons';
import Rating from '../Rating';
import Image from './Image';

const ListItem = ({ data }) => (
  <article className="flex items-center w-full mb-8" key={data.id}>
    <a href={data.url} target="_blank" rel="noreferrer noopener" className="block w-24 h-24 mr-6">
      <Image src={data.image} alt={data.title} />
    </a>

    <div className="flex-1 min-w-0">
      <div className="md:flex">
        <div className="md:flex-1">
          <h1 className="font-medium text-gray-900">
            <a href={data.url} target="_blank" rel="noopener noreferrer">
              {data.title}
            </a>
          </h1>
          {(!is.empty(data.category) || data.rating) && (
            <div className="mt-1 md:flex md:items-center">
              {data.category && <p className="hidden text-xs text-gray-400 md:block md:mr-4">{data.category}</p>}

              {data.rating && (
                <p className="flex items-center mt-2 md:mt-0">
                  <Rating value={Number(data.rating)} />
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 md:mt-0 md:ml-6 md:text-right">
          {data.price && <h2>{formatNumber(Number(data.price), 'USD', true)}</h2>}

          {data.freeShipping === 'true' && (
            <span className="inline-flex items-center text-xs font-medium text-green-500 md:ml-4">
              <IconCheck className="mr-2 fill-current" />
              Free shipping
            </span>
          )}
        </div>
      </div>

      <p
        className="mt-2 text-sm text-gray-500 truncate-2-lines"
        dangerouslySetInnerHTML={{ __html: data.description }}
      />
    </div>
  </article>
);

export default ListItem;
