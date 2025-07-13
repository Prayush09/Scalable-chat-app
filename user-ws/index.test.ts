const BACKEND_URL = 'ws://localhost:3000';

describe("Chat application", () => {
  test("Message sent from room 1 reaches another participant in room 1 via relayer", async () => {
    const ws1 = new WebSocket(BACKEND_URL);
    const ws2 = new WebSocket(BACKEND_URL);

    const waitForOpen = (ws: WebSocket): Promise<void> => {
      return new Promise((resolve) => {
        ws.onopen = () => resolve();
      });
    };

    await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

    ws1.send(JSON.stringify({
      type: 'join',
      room: 'room 1'
    }));

    ws2.send(JSON.stringify({
      type: 'join',
      room: 'room 1'
    }));

    await new Promise(res => setTimeout(res, 200));

    const waitForMessage = (ws: WebSocket): Promise<string> => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject('Message not received within timeout'), 2000);

       ws.onmessage = (event: MessageEvent) => {
          clearTimeout(timeout);
          const raw = event.data;

            if (raw instanceof Blob) {
                const text = raw.text();
                resolve(text);
            } else if (typeof raw === 'string') {
                resolve(raw);
            } else {
                reject(new Error('Unsupported WebSocket message type: ' + typeof raw));
            }
        };
      });
    };

    ws1.send(JSON.stringify({
      type: 'chat',
      room: 'room 1',
      message: 'Hello from room 1'
    }));

    const receivedData = await waitForMessage(ws2);
    const parsed = JSON.parse(receivedData);

    expect(parsed.message).toBe('Hello from room 1');
    expect(parsed.type).toBe('chat');
    expect(parsed.room).toBe('room 1');

    ws1.close();
    ws2.close();
  });
});
