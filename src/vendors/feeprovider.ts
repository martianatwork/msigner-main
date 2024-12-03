import { getFees } from './mempool';
import { OutputType } from '@cmdcode/tapscript/dist/types/schema/types';
import { Dimensions } from '@bitgo/unspents';
import * as utxolib from '@bitgo/utxo-lib';

export async function calculateTxBytesFee(
  vinsLength: number,
  voutsLength: number,
  feeRateTier: string | number,
  adressType?: OutputType,
  includeChangeOutput: 0 | 1 = 1,
) {
  const recommendedFeeRate = await getFees(feeRateTier);
  return calculateTxBytesFeeWithRate(
    vinsLength,
    voutsLength,
    recommendedFeeRate,
    includeChangeOutput,
    adressType
  );
}

export function calculateTxBytesFeeWithRate(
  vinsLength: number,
  voutsLength: number,
  feeRate: number,
  includeChangeOutput: 0 | 1 = 1,
  adressType?: OutputType
): number {
  const baseTxSize = 10;
  let inSize = 180;
  const outSize = 34;

  if(adressType === 'p2tr') {
    inSize = 60;
  }
  if(adressType === 'p2w-pkh') {
    inSize = 70;
  }
  let txSize =
    baseTxSize +
    vinsLength * inSize +
    voutsLength * outSize +
    includeChangeOutput * outSize;
  console.log('DEBUG FOR TX SIZE:', `Original Size ${txSize}`, `ins: ${vinsLength}, ${inSize}`, `outs: ${voutsLength}, ${outSize}`, `feeRate: ${feeRate}`);
  if(txSize > 600 && vinsLength === 4) txSize = 600;
  const fee = txSize * feeRate;
  return fee;
}

export async function calculateTxsFee(
  inputs: {type: utxolib.bitgo.outputScripts.ScriptType | utxolib.bitgo.ParsedScriptType2Of3 | 'p2pkh', times: number},
  outputs: utxolib.TxOutput[],
  feeRateTier: number | string,
): Promise<number> {
  const recommendedFeeRate = await getFees(feeRateTier);
const dimensions = Dimensions.fromScriptType(inputs.type, {scriptPathLevel: 1})
  .times(inputs.times)
  .plus(Dimensions.ASSUME_P2TR_SCRIPTPATH_LEVEL1)
  .plus(Dimensions.fromOutputs(outputs))
  .plus(Dimensions.fromOutputScriptLength(34));
  const txSize = dimensions.getInputsVSize() + dimensions.getOverheadVSize();
  console.log('DEBUG FOR TX SIZE:', `Original Size ${txSize}`, `ins: ${inputs}`, `outs: ${outputs.length}`, `feeRate: ${recommendedFeeRate}`);

  return txSize * recommendedFeeRate;
}

export function getSellerOrdOutputValue(
  price: number,
  makerFeeBp: number,
  prevUtxoValue: number,
): number {
  return (
    price - // listing price
    Math.floor((price * makerFeeBp) / 10000) + // less maker fees, seller implicitly pays this
    prevUtxoValue // seller should get the rest of ord utxo back
  );
}
