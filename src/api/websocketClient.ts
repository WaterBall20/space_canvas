import type { PosData } from "../data/mapData";


export class WSClient {
    private ws: WebSocket | null = null;
    private readonly url: string;
    private readonly reconnectInterval: number;
    private onMessageCallback: ((data: Array<PosData>) => void) | null = null;

    constructor(url: string, reconnectInterval = 3000) {
        this.url = url;
        this.reconnectInterval = reconnectInterval;
        this.connect();
    }

    private connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("WebSocket 已连接");
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as Array<PosData>;
                if (this.onMessageCallback) this.onMessageCallback(data);
            } catch (err) {
                console.error(
                    "接收消息解析错误, data",
                    event.data,
                    "err:",
                    err,
                );
            }
        };

        this.ws.onclose = () => {
            console.warn("WebSocket 连接关闭，尝试重连");
            setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.ws.onerror = (err) => {
            console.error("WebSocket 错误", err);
            this.ws?.close();
        };
    }

    public send(data: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }

    public onMessage(callback: (data: Array<PosData>) => void) {
        this.onMessageCallback = callback;
    }
}
