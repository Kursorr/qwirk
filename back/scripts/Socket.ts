'use strict'

import * as socketio from 'socket.io'
import * as redis from 'socket.io-redis'

import { IDB } from '../app/models/Model'
const configuration = require('../configuration.json')

class Socket {
    private http: any

    private io: any
    get IO(): any { return this.io }

    private db: IDB
    get DB(): IDB { return this.db }

    private secret: string
    get Secret(): string { return this.secret }

    constructor(http: any, db: IDB, secret: string) {
        this.http = http
        this.db = db
        this.secret = secret
        const io = socketio(process.argv[3], {
            transports: ['websocket']
        }).adapter(redis({ host: configuration.redis.host, port: configuration.redis.port }))

        this.io = io
    }
}

export { Socket }
