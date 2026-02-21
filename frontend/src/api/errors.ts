export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: string;
  readonly errorId: string | undefined;

  constructor(status: number, message: string, errorCode: string, errorId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.errorId = errorId;
  }
}

const ERROR_MESSAGES: Record<string, string | ((error: ApiError) => string)> = {
  BOARD_NOT_FOUND: 'ボードが見つかりません',
  CARD_NOT_FOUND: 'カードが見つかりません',
  CARD_NOT_EDITABLE: 'このカードを編集する権限がありません',
  VOTE_LIMIT_REACHED: '投票数の上限に達しました',
  DUPLICATE_VOTE: 'このカードには既に投票済みです',
  NOT_FACILITATOR: 'この操作はファシリテーターのみ実行できます',
  FORBIDDEN: 'この操作を行う権限がありません',
  CONFLICT: 'データの競合が発生しました。ページを再読み込みしてください',
  INVALID_PHASE_TRANSITION: 'このフェーズ変更は実行できません',
  PARTICIPANT_NOT_FOUND: '参加者が見つかりません',
  RESOURCE_NOT_FOUND: 'リソースが見つかりません',
  VALIDATION_ERROR: (error: ApiError) => `入力内容に問題があります: ${error.message}`,
  INTERNAL_ERROR: (error: ApiError) =>
    error.errorId
      ? `予期せぬエラーが発生しました (エラーID: ${error.errorId})`
      : '予期せぬエラーが発生しました',
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const messageOrFn = ERROR_MESSAGES[error.errorCode];
    if (typeof messageOrFn === 'function') {
      return messageOrFn(error);
    }
    if (typeof messageOrFn === 'string') {
      return messageOrFn;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '不明なエラーが発生しました';
}
