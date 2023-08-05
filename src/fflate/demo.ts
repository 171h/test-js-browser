import * as fflate from 'fflate'
import { show } from '../utils'

const zip = fflate.zipSync({ 'doc/index.md': fflate.strToU8('') })
show('[zip]', zip)

const unzip = fflate.unzipSync(zip)
show('[unzip]', JSON.stringify(unzip))

const u8 = fflate.strToU8('Test Uint8Array')
show('[u8]', u8)
