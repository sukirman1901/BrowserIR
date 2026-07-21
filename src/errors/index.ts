export enum ErrorCode {
  INVALID_URL = 'INVALID_URL',
  INVALID_JSON = 'INVALID_JSON',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  CLICK_FAILED = 'CLICK_FAILED',
  SESSION_NOT_STARTED = 'SESSION_NOT_STARTED',
  UNKNOWN_METHOD = 'UNKNOWN_METHOD',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  LISTEN_FAILED = 'LISTEN_FAILED',
}

export class BIRError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'BIRError'
  }
  
  toResponse(requestId: string) {
    return {
      id: requestId,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    }
  }
}