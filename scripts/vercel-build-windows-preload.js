const fs = require('fs')
const path = require('path')

const originalSymlink = fs.symlink
const originalSymlinkSync = fs.symlinkSync
const originalPromisesSymlink = fs.promises.symlink.bind(fs.promises)
const originalRename = fs.rename
const originalRenameSync = fs.renameSync
const originalPromisesRename = fs.promises.rename.bind(fs.promises)

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

function moveFallback(sourcePath, targetPath, callback) {
  try {
    ensureParentDirectory(targetPath)
    fs.cp(resolveSourcePath(sourcePath, targetPath), targetPath, { recursive: true, force: true }, (copyError) => {
      if (copyError) {
        callback(copyError)
        return
      }

      fs.rm(sourcePath, { recursive: true, force: true }, (removeError) => {
        callback(removeError ?? null)
      })
    })
  } catch (error) {
    callback(error)
  }
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

fs.rename = function patchedRename(sourcePath, targetPath, callback) {
  return originalRename.call(fs, sourcePath, targetPath, (error) => {
    if (!shouldFallback(error)) {
      callback?.(error)
      return
    }

    moveFallback(sourcePath, targetPath, callback)
  })
}

fs.renameSync = function patchedRenameSync(sourcePath, targetPath) {
  try {
    return originalRenameSync.call(fs, sourcePath, targetPath)
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    ensureParentDirectory(targetPath)
    fs.cpSync(resolveSourcePath(sourcePath, targetPath), targetPath, { recursive: true, force: true })
    fs.rmSync(sourcePath, { recursive: true, force: true })
  }
}

fs.promises.rename = async function patchedPromisesRename(sourcePath, targetPath) {
  try {
    return await originalPromisesRename(sourcePath, targetPath)
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    ensureParentDirectory(targetPath)
    await fs.promises.cp(resolveSourcePath(sourcePath, targetPath), targetPath, { recursive: true, force: true })
    await fs.promises.rm(sourcePath, { recursive: true, force: true })
  }
}