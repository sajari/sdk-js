/* eslint-disable react/prop-types */
import env from '../../../sajari.config';
import is from '../../utils/is';
import GridItem from './GridItem';
import ListItem from './ListItem';

const fields = { id: '_id', ...env.fields };

const map = (data) =>
  Object.entries(fields).reduce(
    (out, [key, value]) => Object.assign(out, { [key]: is.function(value) ? value(data) : data[value] }),
    {},
  );

const Results = ({ grid, results }) => (
  <div className={grid ? 'grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-8' : undefined}>
    {results.map((result) => {
      const data = map(result.values);

      // Fix crawler issue with http images
      data.image = data.image && data.image.replace('http://', 'https://');

      return grid ? <GridItem data={data} /> : <ListItem data={data} />;
    })}
  </div>
);

export default Results;
