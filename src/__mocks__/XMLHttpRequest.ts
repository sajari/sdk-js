export const mockXMLHttpRequest = () => {
  class XMLMock {
    readyState: number = XMLHttpRequest.UNSENT;
    status: number = 0;
    responseText: string = JSON.stringify({});

    send() {
      this.readyState = XMLHttpRequest.DONE;
      this.status = 200;
      this.responseText = JSON.stringify({
        searchResponse: {
          results: [],
          reads: "0",
          totalResults: "0",
          time: "0"
        },
        values: {}
      });
      this.onreadystatechange();
    }
    open() {}
    setRequestHeader() {}
    onreadystatechange() {}
  }

  (window as any).XMLHttpRequest = jest.fn(() => new XMLMock());
};
