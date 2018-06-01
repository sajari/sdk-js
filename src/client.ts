import { pipeline, Pipeline } from "./pipeline";

// ClientOption defines a function which modifies a [[Client]] during it's construction.
export type ClientOption = (client: Client) => void;

// withEndpoint constructs a [[ClientOption]] that modifies the endpoint used by the client.
export const withEndpoint = (endpoint: string) => (client: Client) => {
  client.endpoint = endpoint;
};

// Client takes configuration and constructs pipelines clients.
//
// ```javascript
// const client = new Client("<project>", "<collection>");
// const webPipeline = client.pipeline("website");
// // webPipeline.search(...);
// ```
//
// An optional array of [[ClientOption]] may be given to the client constructor to modify it's behaviour.
//
// ```javascript
// const client = new Client("<project>", "<collection>", withEndpoint("https://example.com"));
// ```
export class Client {
  public project: string;
  public collection: string;
  public endpoint: string;

  // Constructs an instance of Client.
  public constructor(
    project: string,
    collection: string,
    opts: ClientOption[] = []
  ) {
    this.project = project;
    this.collection = collection;
    this.endpoint = "https://jsonapi.sajari.net";
    opts.forEach(opt => {
      opt(this);
    });
  }

  // pipeline returns a new [[Pipeline]] instance using this client for configuration.
  public pipeline(name: string): Pipeline {
    return new pipeline(this, name);
  }
}
