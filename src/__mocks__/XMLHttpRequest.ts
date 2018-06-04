const defaultStatus = 200;
const defaultResponseText = JSON.stringify({
  searchResponse: {
    results: [],
    reads: "0",
    totalResults: "0",
    time: "0"
  },
  values: {}
});

export const XMLHttpRequestMock = ({
  status = defaultStatus,
  responseText = defaultResponseText
}: any = {}): void => {
  class Mock {
    readyState: number = XMLHttpRequest.UNSENT;
    status: number = 0;
    responseText: string = JSON.stringify({});

    send() {
      this.readyState = XMLHttpRequest.DONE;
      this.status = status;
      this.responseText = JSON.stringify(responseText);
      this.onreadystatechange();
    }
    open() {}
    setRequestHeader() {}
    onreadystatechange() {}
  }

  (window as any).XMLHttpRequest = jest.fn(() => new Mock());
};
