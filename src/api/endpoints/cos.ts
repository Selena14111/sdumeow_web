import COS from 'cos-js-sdk-v5'

import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'
import { asArray, asRecord, asString } from '@/utils/format'

export type PrepareUploadPayload = {
  types: string[]
}

type CosCredential = {
  tmpSecretId: string
  tmpSecretKey: string
  sessionToken: string
  startTime?: number
  expiredTime?: number
}

type PreparedUpload = {
  key: string
  bucket: string
  region: string
  credential: CosCredential
  accessUrl?: string
  raw: unknown
}

function getImageType(file: File): string {
  const extension = file.name.split('.').pop()?.trim().toLowerCase()
  if (extension) {
    return extension === 'jpeg' ? 'jpg' : extension
  }

  const mimeSubtype = file.type.split('/')[1]?.trim().toLowerCase()
  return mimeSubtype ? (mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype) : 'jpg'
}

export function prepareImageUpload(payload: PrepareUploadPayload): Promise<ApiResult<unknown>> {
  return apiRequest({ method: 'POST', url: '/cos/upload-image', data: payload })
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const uploaded = await uploadPreparedImages(files)
  return uploaded.map((item) => item.key)
}

export async function uploadImageKeys(files: File[]): Promise<string[]> {
  const uploaded = await uploadPreparedImages(files)
  return uploaded.map((item) => item.key)
}

async function uploadPreparedImages(files: File[]): Promise<PreparedUpload[]> {
  if (!files.length) {
    return []
  }

  const preparedResult = await prepareImageUpload({ types: files.map(getImageType) })
  const preparedUploads = normalizePreparedUploads(preparedResult.data)

  if (preparedUploads.length < files.length) {
    throw new Error('上传接口返回的图片凭证数量不足')
  }

  await Promise.all(files.map((file, index) => putObjectToCos(file, preparedUploads[index])))
  return preparedUploads
}

function normalizePreparedUploads(data: unknown): PreparedUpload[] {
  const root = asRecord(data)
  const commonCredential = pickCredential(root)
  const commonBucket = pickBucket(root)
  const commonRegion = pickRegion(root)
  const commonItems = asArray<unknown>(root.items || root.files || root.uploads || root.list || root.keys)
  const source = Array.isArray(data) ? data : commonItems.length ? commonItems : Object.keys(root).length ? [root] : []

  return source.map((item) => {
    const record = asRecord(item)
    const nested = asRecord(record.image || record.file || record.data)
    const credential = pickCredential(record) ?? pickCredential(nested) ?? commonCredential
    const key = pickKey(record) || pickKey(nested) || (typeof item === 'string' ? item : '')
    const bucket = pickBucket(record) || pickBucket(nested) || commonBucket
    const region = pickRegion(record) || pickRegion(nested) || commonRegion

    if (!key) {
      throw new Error('上传接口未返回图片 key')
    }
    if (!bucket || !region || !credential) {
      throw new Error('上传接口未返回完整 COS 临时凭证')
    }

    return {
      key,
      bucket,
      region,
      credential,
      accessUrl: asString(record.accessUrl || record.publicUrl || record.url || nested.accessUrl || nested.publicUrl || nested.url),
      raw: item,
    }
  })
}

function pickKey(record: Record<string, unknown>): string {
  return asString(record.key || record.objectKey || record.fileKey || record.cosKey || record.path).replace(/^\/+/, '')
}

function pickBucket(record: Record<string, unknown>): string {
  return asString(record.bucket || record.Bucket || record.bucketName || record.BucketName)
}

function pickRegion(record: Record<string, unknown>): string {
  return asString(record.region || record.Region)
}

function pickCredential(record: Record<string, unknown>): CosCredential | null {
  const candidates = [
    record,
    asRecord(record.credentials),
    asRecord(record.credential),
    asRecord(record.tmpCredential),
    asRecord(record.tempCredential),
    asRecord(record.authorization),
  ]

  for (const item of candidates) {
    const tmpSecretId = asString(item.tmpSecretId || item.TmpSecretId || item.secretId || item.SecretId)
    const tmpSecretKey = asString(item.tmpSecretKey || item.TmpSecretKey || item.secretKey || item.SecretKey)
    const sessionToken = asString(item.sessionToken || item.SessionToken || item.securityToken || item.SecurityToken || item.token)
    if (tmpSecretId && tmpSecretKey && sessionToken) {
      return {
        tmpSecretId,
        tmpSecretKey,
        sessionToken,
        startTime: asOptionalNumber(item.startTime || item.StartTime),
        expiredTime: asOptionalNumber(item.expiredTime || item.ExpiredTime),
      }
    }
  }

  return null
}

function asOptionalNumber(value: unknown): number | undefined {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

function putObjectToCos(file: File, prepared: PreparedUpload): Promise<void> {
  const cos = new COS({
    SecretId: prepared.credential.tmpSecretId,
    SecretKey: prepared.credential.tmpSecretKey,
    SecurityToken: prepared.credential.sessionToken,
    StartTime: prepared.credential.startTime,
    ExpiredTime: prepared.credential.expiredTime,
  })

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: prepared.bucket,
        Region: prepared.region,
        Key: prepared.key,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
      },
      (error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      },
    )
  })
}
