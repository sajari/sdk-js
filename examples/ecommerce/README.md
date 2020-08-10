# Ecommerce Example

A lightweight and fast example user interface using the Sajari JavaScript SDK in an ecommerce project.

![Video of the example in action](video.gif)

The demo uses:

- [Preact](https://preactjs.com/)
- [Preact CLI](https://preactjs.com/cli/)
- [Tailwind](https://tailwindcss.com/)
- [PurgeCSS](https://purgecss.com/)

## Getting started

- Clone the [`sajari-sdk-js`](https://github.com/sajari/sajari-sdk-js) repo.
- `cd` to `examples/ecommerce`.
- Create a `.env` file with account and pipeline info as below.
- Edit `sajari.config.js` with the correct project, collection, pipeline, etc.
- Run `yarn && yarn start`.
- Open a browser and head to [http://localhost:8080](http://localhost:8080).

### Example .env file

```
APP_ENDPOINT="https://jsonapi-us-valkyrie.sajari.net"
APP_ACCOUNT_ID="1594153711901724220"
APP_COLLECTION_ID="bestbuy"
APP_PIPELINE_NAME="query"
APP_PIPELINE_VERSION=""
```

# TODO

- [] Convert to TypeScript
- [] Use hooks/context more
