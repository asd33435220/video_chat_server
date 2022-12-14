import * as WSocket from "ws";
const wsMap = new Map<string, WSocket.WebSocket>()
const fnMap = new Map<string, Function>()
const wss = new WSocket.Server({ port: 8010 })
interface baseOption {
    event: string;
    data: any;
    callbackId?: string;
    callId?: string;
}
interface sendOption extends baseOption {
    code: string;
}
const closeTimeout = (ws: WSocket.WebSocket) => {
    setTimeout(() => {
        ws.terminate()
    }, 10 * 60 * 1000)
}
const sendData = (ws: WSocket.WebSocket, option: sendOption) => {
    ws.send(JSON.stringify(option))
}
const getResponse = (ws: WSocket.WebSocket, option: sendOption) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve('timeout')
        }, 1000)
        option.callbackId = Math.random().toString(36)
        fnMap.set(option.callbackId, (data: unknown) => {
            resolve(data)
        })
        sendData(ws, option)
    })
}

wss.on('connection', (ws: WSocket.WebSocket, request) => {
    let code = String(Math.floor(Math.random() * (999999 - 100000)) + 100000)
    console.log(`new connection room code: ${code}`);
    wsMap.set(code, ws)
    ws.on('message', async (message: string) => {
        let parsedMessage: baseOption
        try {
            parsedMessage = JSON.parse(message)
        } catch (e) {
            console.log('e', e);
            return
        }
        const { event, data, callbackId, callId } = parsedMessage
        if (callbackId && fnMap.has(callbackId)) {
            const fn = fnMap.get(callbackId) as Function
            fn(data)
            fnMap.delete(callbackId)
        }
        switch (event) {
            case 'startLive':
                sendData(ws, { event, data: code, code, callId })
                break;
            case 'getAnswer':
                {
                    const { offer, code: liveRoom } = data
                    if (!wsMap.has(liveRoom)) {
                        sendData(ws, { event, data: '不存在的直播间', code, callId })
                    } else {
                        const liveWs = wsMap.get(liveRoom) as WSocket.WebSocket
                        const answer = await getResponse(liveWs, { code: liveRoom, event: 'offer2answer', data: offer })
                        sendData(ws, { code, callId, data: answer, event })
                    }
                }
                break;
            case 'addCandidate':
                {
                    const { candidate, code: liveRoom } = data
                    if (!wsMap.has(liveRoom)) {
                        sendData(ws, { event, data: '不存在的直播间', code, callId })
                    } else {
                        const liveWs = wsMap.get(liveRoom) as WSocket.WebSocket
                        sendData(liveWs, { code: liveRoom, event: 'audienceCandidate', data: candidate })
                    }
                }
            default:
                break;
        }
    })
    ws.on('close', () => {
        wsMap.delete(code)
        closeTimeout(ws)
    })
})
