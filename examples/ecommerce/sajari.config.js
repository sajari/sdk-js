import filterTypes from './src/components/Filters/types';

/**
 * Your environment configuration
 */
export default {
  // These details can be found in your console
  project: '1588205875936974083',
  collection: 'best-buy',
  pipeline: 'query',
  version: undefined, // undefined will use the default version

  // For production this can be undefined
  endpoint: 'https://jsonapi-us-valkyrie-beta1.sajari.net',

  // Which facets to display
  // Order in the UI is defined by their order here
  // field: Field to use in results
  // title: Title to display for the filter
  // type: The type of filter to be displayed
  // sort: Whether to sort based on the count
  facets: [
    { field: 'level1', title: 'Category', sort: true },
    { field: 'brand', title: 'Brand', sort: true },
    { field: 'price_range', title: 'Price', type: filterTypes.price },
    { field: 'imageTags', title: 'Color', type: filterTypes.color },
    { field: 'rating', title: 'Rating', type: filterTypes.rating },
  ],

  // A map for data fields
  // If a function is specified, the record data will be passed as the single argument
  fields: {
    image: 'image',
    url: 'url',
    title: 'name',
    description: 'description',
    rating: 'rating',
    price: 'price',
    freeShipping: 'free_shipping',
    category: (data) => data.level4 || data.level3 || data.level2 || data.level1,
  },
};
