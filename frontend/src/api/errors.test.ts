import { describe, it, expect } from 'vitest';
import { ApiError, getErrorMessage } from './errors';

describe('ApiError', () => {
  it('HTTPステータスコード、メッセージ、エラーコードを保持する', () => {
    const error = new ApiError(404, 'Not found', 'BOARD_NOT_FOUND');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.errorCode).toBe('BOARD_NOT_FOUND');
    expect(error.errorId).toBeUndefined();
  });

  it('エラーIDを保持できる', () => {
    const error = new ApiError(500, 'Internal error', 'INTERNAL_ERROR', 'abc-123');
    expect(error.errorId).toBe('abc-123');
  });

  it('Errorクラスを継承している', () => {
    const error = new ApiError(400, 'Bad request', 'BAD_REQUEST');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it('nameプロパティがApiErrorである', () => {
    const error = new ApiError(403, 'Forbidden', 'FORBIDDEN');
    expect(error.name).toBe('ApiError');
  });
});

describe('getErrorMessage', () => {
  it('BOARD_NOT_FOUNDのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(404, 'Board not found', 'BOARD_NOT_FOUND');
    expect(getErrorMessage(error)).toBe('ボードが見つかりません');
  });

  it('CARD_NOT_FOUNDのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(404, 'Card not found', 'CARD_NOT_FOUND');
    expect(getErrorMessage(error)).toBe('カードが見つかりません');
  });

  it('VOTE_LIMIT_REACHEDのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(400, 'Vote limit reached', 'VOTE_LIMIT_REACHED');
    expect(getErrorMessage(error)).toBe('投票数の上限に達しました');
  });

  it('DUPLICATE_VOTEのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(409, 'Duplicate vote', 'DUPLICATE_VOTE');
    expect(getErrorMessage(error)).toBe('このカードには既に投票済みです');
  });

  it('NOT_FACILITATORのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(403, 'Not facilitator', 'NOT_FACILITATOR');
    expect(getErrorMessage(error)).toBe('この操作はファシリテーターのみ実行できます');
  });

  it('FORBIDDENのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(403, 'Forbidden', 'FORBIDDEN');
    expect(getErrorMessage(error)).toBe('この操作を行う権限がありません');
  });

  it('CONFLICTのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(409, 'Conflict', 'CONFLICT');
    expect(getErrorMessage(error)).toBe('データの競合が発生しました。ページを再読み込みしてください');
  });

  it('VALIDATION_ERRORのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(400, 'content: must not be blank', 'VALIDATION_ERROR');
    expect(getErrorMessage(error)).toBe('入力内容に問題があります: content: must not be blank');
  });

  it('INVALID_PHASE_TRANSITIONのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(400, 'Invalid phase transition', 'INVALID_PHASE_TRANSITION');
    expect(getErrorMessage(error)).toBe('このフェーズ変更は実行できません');
  });

  it('CARD_NOT_EDITABLEのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(403, 'Cannot edit', 'CARD_NOT_EDITABLE');
    expect(getErrorMessage(error)).toBe('このカードを編集する権限がありません');
  });

  it('PARTICIPANT_NOT_FOUNDのエラーコードに対して日本語メッセージを返す', () => {
    const error = new ApiError(404, 'Participant not found', 'PARTICIPANT_NOT_FOUND');
    expect(getErrorMessage(error)).toBe('参加者が見つかりません');
  });

  it('INTERNAL_ERRORのエラーコードに対して日本語メッセージとエラーIDを返す', () => {
    const error = new ApiError(500, 'Internal error', 'INTERNAL_ERROR', 'err-uuid-123');
    expect(getErrorMessage(error)).toBe('予期せぬエラーが発生しました (エラーID: err-uuid-123)');
  });

  it('INTERNAL_ERRORでエラーIDがない場合は基本メッセージのみ返す', () => {
    const error = new ApiError(500, 'Internal error', 'INTERNAL_ERROR');
    expect(getErrorMessage(error)).toBe('予期せぬエラーが発生しました');
  });

  it('未知のエラーコードの場合はサーバーメッセージをフォールバックとして返す', () => {
    const error = new ApiError(400, 'Some unknown error', 'UNKNOWN_CODE');
    expect(getErrorMessage(error)).toBe('Some unknown error');
  });

  it('通常のErrorオブジェクトの場合はメッセージをそのまま返す', () => {
    const error = new Error('network failure');
    expect(getErrorMessage(error)).toBe('network failure');
  });

  it('未知のエラー型の場合はデフォルトメッセージを返す', () => {
    expect(getErrorMessage('string error')).toBe('不明なエラーが発生しました');
    expect(getErrorMessage(null)).toBe('不明なエラーが発生しました');
    expect(getErrorMessage(undefined)).toBe('不明なエラーが発生しました');
  });
});
