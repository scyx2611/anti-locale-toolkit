const {
  SUPPORTED_APP_VERSIONS,
  SUPPORTED_APP_VERSION,
  getVersionCompatibility,
} = require('./patcher');

const legacy = getVersionCompatibility('2.12.0');
const current = getVersionCompatibility('2.12.2');
const mismatch = getVersionCompatibility('2.12.3');

if (
  SUPPORTED_APP_VERSION !== '2.12.2' ||
  SUPPORTED_APP_VERSIONS.join('|') !== '2.12.0|2.12.2' ||
  !legacy.supported ||
  !current.supported ||
  mismatch.supported ||
  mismatch.expected.join('|') !== '2.12.0|2.12.2' ||
  mismatch.detected !== '2.12.3'
) {
  throw new Error('版本相容性策略檢查失敗');
}

console.log('版本相容性策略檢查通過：不符版本會標記為未驗證並由 patcher 顯示警告。');
