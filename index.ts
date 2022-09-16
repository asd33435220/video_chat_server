const WSocket = require('ws')
const wsMap = new Map<string, any>()
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
wss.on('connection', (ws, request) => {
    let code = String(Math.floor(Math.random() * (999999 - 100000)) + 100000)
    console.log(`new connection room code: ${code}`);
    wsMap.set(code, ws)
    ws.sendData = (option: sendOption) => {
        ws.send(JSON.stringify(option))
    }
    ws.getResponse = (option: sendOption) => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve('timeout')
            }, 1000)
            option.callbackId = Math.random().toString(36)
            fnMap.set(option.callbackId, (data: unknown) => {
                resolve(data)
            })
            ws.sendData(option)
        })

    }

    ws.on('message', async message => {
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
                ws.sendData({ event, data: code, code, callId })
                break;
            case 'getAnswer':
                {
                    const { offer, code: liveRoom } = data
                    if (!wsMap.has(liveRoom)) {
                        ws.sendData({ event, data: '不存在的直播间', code, callId })
                    } else {
                        const liveWs = wsMap.get(liveRoom)
                        const answer = await liveWs.getResponse({ code: liveRoom, event: 'offer2answer', data: offer })
                        ws.sendData({ code, callId, data: answer, event })
                    }
                }
                break;
            case 'addCandidate':
                {
                    const { candidate, code: liveRoom } = data
                    if (!wsMap.has(liveRoom)) {
                        ws.sendData({ event, data: '不存在的直播间', code, callId })
                    } else {
                        const liveWs = wsMap.get(liveRoom)
                        liveWs.sendData({ code: liveRoom, event: 'audienceCandidate', data: candidate })
                    }
                }
            default:
                break;
        }
    })
    ws._closeTimeout = () => {
        setTimeout(() => {
            ws.terminate()
        }, 10 * 60 * 1000)
    }
    ws.on('close', () => {
        wsMap.delete(code)
        
        ws._closeTimeout()
    })
})
