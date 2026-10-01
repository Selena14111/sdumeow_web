export const validators = {
  required(message: string) {
    return { required: true, message }
  },
  minLength(length: number, message: string) {
    return { min: length, message }
  },
}
