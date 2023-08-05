import { Buffer } from 'buffer'
import { show } from '../utils'

const ctx = 'buffer/demo.ts'

const u8 = new Uint8Array([1, 2, 3])
show(ctx + '[u8]', u8)

const buf = Buffer.from(u8)
show(ctx + '[buf]', buf)
