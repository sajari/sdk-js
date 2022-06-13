import env from 'config/sajari.config';
import is from 'utils/is';
import { transformCase } from 'utils/string';
import GridItem from './GridItem';
import ListItem from './ListItem';

export interface ResultItem {
  id: string;
  url: string;
  image: string;
  title: string;
  rating: number;
  price: number;
  freeShipping: string;
  category: string;
  description: string;
}

interface RawData {
  _id: string;
  url: string;
  image: string;
  name: string;
  description: string;
  rating: number;
  price: number;
  free_shipping: string;
  level4?: string;
  level3?: string;
  level2?: string;
  level1?: string;
}

const fields = { id: '_id', ...env.fields };

const mapEntry = (data: RawData, key: string, value: keyof RawData | Array<keyof RawData> | Function) => {
  if (is.function(value)) {
    return { [key]: value(data) };
  }
  if (is.array(value)) {
    const [field, transform] = value;
    return { [key]: transformCase(data[field]?.toString(), transform) };
  }

  return { [key]: data[value] };
};

const mapData = (data: RawData) =>
  Object.entries(fields).reduce<ResultItem>(
    (out, [key, value]) => Object.assign(out, mapEntry(data, key, value as keyof RawData)),
    {} as ResultItem,
  );

interface Props {
  grid: boolean;
  results: { values: RawData }[];
}

const Results = ({ grid, results }: Props) => {
  return (
    <div className={grid ? 'grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-8' : undefined}>
      {results.map((result) => {
        const data = mapData(result.values);

        // Fix crawler issue with http images
        data.image = data.image && data.image.replace('http://', 'https://');

        return grid ? (
          <GridItem key={`grid-${data.id}`} data={data} />
        ) : (
          <ListItem key={`list-${data.id}`} data={data} />
        );
      })}
    </div>
  );
};

export default Results;
