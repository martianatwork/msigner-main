import { AddressTxsUtxo } from '@mempool/mempool.js/lib/interfaces/bitcoin/addresses';
import * as bitcoin from 'bitcoinjs-lib';
import { InputsToSign, utxo } from './interfaces';
import { getTxHex } from './vendors/mempool';

export const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.subarray(1, 33);

export const satToBtc = (sat: number) => sat / 100000000;
export const btcToSats = (btc: number) => btc * 100000000;

export function generateTxidFromHash(hash: Buffer) {
  return hash.reverse().toString('hex');
}

export async function mapUtxos(
  utxosFromMempool: AddressTxsUtxo[],
): Promise<utxo[]> {
  const ret: utxo[] = [];
  for (const utxoFromMempool of utxosFromMempool) {
    ret.push({
      txid: utxoFromMempool.txid,
      vout: utxoFromMempool.vout,
      value: utxoFromMempool.value,
      status: utxoFromMempool.status,
      tx: bitcoin.Transaction.fromHex(
        await getTxHex(utxoFromMempool.txid),
      ),
    });
  }
  return ret;
}

export function isP2SHAddress(
  address: string,
  network: bitcoin.Network,
): boolean {
  try {
    const { version, hash } = bitcoin.address.fromBase58Check(address);
    return version === network.scriptHash && hash.length === 20;
  } catch (error) {
    return false;
  }
}

/**
 * Merges or updates buyerSigningInputs based on the address field.
 * @param {InputsToSign[]} inputs - Array of InputsToSign to merge/update.
 * @param {InputsToSign} newInput - New input to merge or update.
 */
export function mergeOrUpdate(inputs: InputsToSign[], newInput: InputsToSign): InputsToSign[] {
  const existingInput = inputs.find(input => input.address === newInput.address);

  if (existingInput) {
    existingInput.signingIndexes = Array.from(
      new Set([...existingInput.signingIndexes, ...newInput.signingIndexes])
    );
  } else {
    inputs.push(newInput);
  }
  return inputs;
}
