const fs = require('fs')
const path = require('path')

const originalSymlink = fs.symlink
const originalSymlinkSync = fs.symlinkSync
const originalPromisesSymlink = fs.promises.symlink.bind(fs.promises)

function ensureParentDirectory(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
}

function resolveSourcePath(sourcePath, targetPath) {
  return path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(path.dirname(targetPath), sourcePath)
}

function copyFallback(sourcePath, targetPath, callback) {
  try {
    ensureParentDirectory(targetPath)
    fs.cp(resolveSourcePath(sourcePath, targetPath), targetPath, { recursive: true, force: true }, callback)
  } catch (error) {
    callback(error)
  }
}

function shouldFallback(error) {
  return process.platform === 'win32' && !!error && (error.code === 'EPERM' || error.code === 'ENOENT')
}

fs.symlink = function patchedSymlink(sourcePath, targetPath, type, callback) {
  const normalizedType = typeof type === 'function' ? undefined : type
  const normalizedCallback = typeof type === 'function' ? type : callback

  return originalSymlink.call(fs, sourcePath, targetPath, normalizedType, (error) => {
    if (!shouldFallback(error)) {
      normalizedCallback?.(error)
      return
    }

    copyFallback(sourcePath, targetPath, normalizedCallback)
  })
}

fs.symlinkSync = function patchedSymlinkSync(sourcePath, targetPath, type) {
  try {
    return originalSymlinkSync.call(fs, sourcePath, targetPath, type)
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    ensureParentDirectory(targetPath)
    fs.cpSync(resolveSourcePath(sourcePath, targetPath), targetPath, { recursive: true, force: true })
  }
}

fs.promises.symlink = async function patchedPromisesSymlink(sourcePath, targetPath, type) {
  try {
    return await originalPromisesSymlink(sourcePath, targetPath, type)
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    ensureParentDirectory(targetPath)
    return fs.promises.cp(resolveSourcePath(sourcePath, targetPath), targetPath, { recursive: true, force: true })
  }
}