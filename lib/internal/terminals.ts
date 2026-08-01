export const getTerminalKey = (reference: string, pinNumber: string): string =>
  `${reference}\0${pinNumber}`

export const getNumericPinNumber = (pinNumber: string): number | undefined => {
  if (!/^[0-9]+$/u.test(pinNumber)) return undefined
  const numericPinNumber = Number(pinNumber)
  return Number.isSafeInteger(numericPinNumber) ? numericPinNumber : undefined
}
