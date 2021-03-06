import axios from 'axios'
import Provider from '@liquality/provider'

import { version } from '../package.json'

export default class BitcoinEsploraSwapFindProvider extends Provider {
  constructor (url) {
    super()
    this.url = url
    this._axios = axios.create({
      baseURL: url,
      responseType: 'text',
      transformResponse: undefined // https://github.com/axios/axios/issues/907,
    })
  }

  async findAddressTransaction (address, currentHeight, predicate) {
    // TODO: This does not go through pages as swap addresses have at most 2 transactions
    // Investigate whether retrieving more transactions is required.
    const response = await this._axios.get(`/address/${address}/txs`)
    const transactions = response.data
    for (const transaction of transactions) {
      const formattedTransaction = await this.getMethod('formatTransaction')(transaction, currentHeight)
      if (predicate(formattedTransaction)) {
        return formattedTransaction
      }
    }
  }

  async findSwapTransaction (recipientAddress, refundAddress, secretHash, expiration, blockNumber, predicate) {
    const currentHeight = await this.getMethod('getBlockHeight')()
    const swapOutput = this.getMethod('getSwapOutput')(recipientAddress, refundAddress, secretHash, expiration)
    const paymentVariants = this.getMethod('getSwapPaymentVariants')(swapOutput)
    for (const paymentVariant of Object.values(paymentVariants)) {
      const addressTransaction = this.findAddressTransaction(paymentVariant.address, currentHeight, predicate)
      if (addressTransaction) return addressTransaction
    }
  }

  doesBlockScan () {
    return false
  }
}

BitcoinEsploraSwapFindProvider.version = version
